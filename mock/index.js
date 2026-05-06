const chokidar = require('chokidar')
const bodyParser = require('body-parser')
const chalk = require('chalk')
const path = require('path')
const { mock } = require('mockjs')
const { baseURL } = require('../src/config')
const mockDir = path.join(process.cwd(), 'mock')
const { handleMockArray } = require('./utils')

/**
 *
 * @param app
 * @returns {{mockStartIndex: number, mockRoutesLength: number}}
 */
const registerRoutes = (app) => {
  let mockLastIndex
  const mocks = []
  const mockArray = handleMockArray()
  mockArray.forEach((item) => {
    const obj = require(item)
    mocks.push(...obj)
  })
  const mocksForServer = mocks.map((route) => {
    return responseFake(route.url, route.type, route.response)
  })

  // Some dev-servers expose an Express app (app.get/app.post + app._router),
  // others only expose a connect-style middleware app (app.use).
  const supportsExpressRoutes =
    !!app &&
    typeof app.use === 'function' &&
    !!app._router &&
    Array.isArray(app._router.stack)

  if (supportsExpressRoutes) {
    for (const mock of mocksForServer) {
      if (typeof app[mock.type] !== 'function') {
        throw new TypeError(`mock server: app.${mock.type} is not a function`)
      }
      app[mock.type](mock.url, mock.response)
      mockLastIndex = app._router.stack.length
    }
  } else {
    for (const mock of mocksForServer) {
      app.use((req, res, next) => {
        const method = (req.method || 'GET').toLowerCase()
        if (method !== mock.type) return next()
        const url = req.url || ''
        if (!mock.url.test(url)) return next()
        return mock.response(req, res)
      })
    }
    mockLastIndex = undefined
  }

  const mockRoutesLength = mocksForServer.length
  return {
    mockRoutesLength: mockRoutesLength,
    mockStartIndex: mockLastIndex - mockRoutesLength,
  }
}

/**
 *
 * @param url
 * @param type
 * @param respond
 * @returns {{response(*=, *=): void, type: (*|string), url: RegExp}}
 */
const responseFake = (url, type, respond) => {
  // 处理baseURL和url，确保不会出现双斜杠
  const base = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
  const apiUrl = url.startsWith('/') ? url : `/${url}`
  return {
    url: new RegExp(`${base}${apiUrl}`),
    type: type || 'get',
    response(req, res) {
      const reqPath = req && (req.path || req.url) ? (req.path || req.url) : ''
      const body = req && typeof req.body !== 'undefined' ? req.body : {}

      if (JSON.stringify(body) !== '{}') {
        console.log(chalk.green(`> 请求地址：${reqPath}`))
        console.log(chalk.green(`> 请求参数：${JSON.stringify(body)}\n`))
      } else {
        console.log(chalk.green(`> 请求地址：${reqPath}\n`))
      }

      const payload = mock(respond instanceof Function ? respond(req, res) : respond)

      if (res && typeof res.status === 'function' && typeof res.json === 'function') {
        return res.status(200).json(payload)
      }

      // Node http.ServerResponse fallback
      if (res) {
        res.statusCode = 200
        if (typeof res.setHeader === 'function') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
        }
        if (typeof res.end === 'function') {
          return res.end(JSON.stringify(payload))
        }
      }
    },
  }
}
/**
 *
 * @param app
 */
module.exports = (app) => {
  app.use(bodyParser.json())
  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  )

  const mockRoutes = registerRoutes(app)
  let mockRoutesLength = mockRoutes.mockRoutesLength
  let mockStartIndex = mockRoutes.mockStartIndex

  // Hot-reloading mocks requires Express internals; otherwise it will crash.
  // Also, on macOS it's easy to hit watch limits (EMFILE), so allow opting out.
  const canHotReloadMocks =
    !!app && !!app._router && Array.isArray(app._router.stack) && typeof mockStartIndex === 'number'
  const enableMockWatch =
    process.env.MOCK_WATCH !== 'false' && process.env.MOCK_WATCH !== '0' && canHotReloadMocks

  if (!enableMockWatch) return

  chokidar
    .watch(mockDir, {
      ignored: /mock-server/,
      ignoreInitial: true,
      usePolling: process.env.CHOKIDAR_USEPOLLING === '1',
      interval: 500,
    })
    .on('all', (event) => {
      if (event === 'change' || event === 'add') {
        try {
          app._router.stack.splice(mockStartIndex, mockRoutesLength)

          Object.keys(require.cache).forEach((item) => {
            if (item.includes(mockDir)) {
              delete require.cache[require.resolve(item)]
            }
          })
          const mockRoutes = registerRoutes(app)
          mockRoutesLength = mockRoutes.mockRoutesLength
          mockStartIndex = mockRoutes.mockStartIndex
        } catch (error) {
          console.log(chalk.red(error))
        }
      }
    })
    .on('error', (error) => {
      console.log(chalk.yellow(error))
    })
}

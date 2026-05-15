import axios from "axios";
import {
  baseURL,
  contentType,
  debounce,
  invalidCode,
  loginInterception,
  noPermissionCode,
  requestTimeout,
  successCode,
  tokenName,
} from "@/config";
import store from "@/store";
import qs from "qs";
import router from "@/router";
import { isArray } from "@/utils/validate";
import { ElLoading, ElMessage } from "element-plus";
import { pickBy, identity } from "lodash-es";
import { mock } from "mockjs";
import { appConfig } from "@/config/app.config";

// 根据统一配置按需引入 mock 数据
if (appConfig.dataSource === "mock") {
  const mockContext = require.context("../../mock/controller", true, /\.js$/);
  mockContext.keys().forEach((key) => {
    const mockModule = mockContext(key);
    if (mockModule.default) {
      mockModule.default;
    } else {
      mockModule;
    }
  });
}

let loadingInstance;

/**
 * @author https://github.com/zxwk1998/vue-admin-better （不想保留author可删除）
 * @description 处理code异常
 * @param {*} code
 * @param {*} msg
 */
const redirectToLogin = () => {
  const path = router.currentRoute.value.fullPath;
  if (path && path !== "/login") {
    router.push(`/login?redirect=${path}`).catch(() => {});
  } else {
    router.push("/login").catch(() => {});
  }
};

const handleCode = (code, msg) => {
  switch (code) {
    case invalidCode:
      store.dispatch("user/resetAccessToken");
      if (loginInterception) {
        ElMessage.error(msg || "登录已过期，请重新登录");
        redirectToLogin();
      }
      break;
    case noPermissionCode:
      router.push({ path: "/401" }).catch(() => {});
      break;
    default:
      ElMessage.error(msg || `后端接口${code}异常`);
      break;
  }
};

// 请求重试配置
const retryConfig = {
  retry: 1, // 重试次数
  retryDelay: 1000, // 重试间隔时间
};

// 创建axios实例
const instance = axios.create({
  baseURL,
  timeout: requestTimeout,
  headers: {
    "Content-Type": contentType,
  },
});

// 请求重试方法
instance.defaults.retry = retryConfig.retry;
instance.defaults.retryDelay = retryConfig.retryDelay;

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    if (store.state.user.accessToken) {
      config.headers[tokenName] = "bearer " + store.state.user.accessToken;
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else if (config.data) {
      config.data = pickBy(config.data, identity);
    }
    if (config.params) config.params = pickBy(config.params, identity);
    if (
      config.data &&
      config.headers["Content-Type"] ===
      "application/x-www-form-urlencoded;charset=UTF-8"
    )
      config.data = qs.stringify(config.data);
    if (debounce.some((item) => config.url.includes(item)))
      loadingInstance = ElLoading.service();

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 全局响应拦截器
instance.interceptors.response.use(
  (response) => {
    if (loadingInstance) loadingInstance.close();

    const { data, config } = response;

    // 判断data是否为undefined或null
    if (data === undefined || data === null) {
      ElMessage.error("后端接口返回数据为空");
      return Promise.reject("后端接口返回数据为空");
    }

    // 安全地解构code和msg，避免undefined异常
    const code = data.code !== undefined ? data.code : null;
    const msg = data.msg !== undefined ? data.msg : "未知错误";

    // 操作正常Code数组
    const codeVerificationArray = isArray(successCode)
      ? [...successCode]
      : [...[successCode]];

    // 是否操作正常
    if (code !== null && codeVerificationArray.includes(code)) {
      return data;
    } else {
      handleCode(code, msg);
      return Promise.reject(
        `请求异常拦截:${JSON.stringify({
          url: config.url,
          code,
          msg,
        })}` || "Error"
      );
    }
  },
  (error) => {
    if (loadingInstance) loadingInstance.close();

    // 处理请求重试
    const { config } = error;
    if (config && config.retry) {
      // 设置当前重试次数
      config.__retryCount = config.__retryCount || 0;

      // 检查是否可以重试
      if (config.__retryCount < config.retry) {
        // 增加重试次数
        config.__retryCount += 1;

        // 创建新的Promise进行重试
        const backoff = new Promise((resolve) => {
          setTimeout(() => {
            console.log(
              `重试请求: ${config.url}, 尝试次数: ${config.__retryCount}`
            );
            resolve();
          }, config.retryDelay || 1000);
        });

        // 重新发起请求
        return backoff.then(() => instance(config));
      }
    }

    // 处理undefined或无法解析的错误情况
    if (!error) {
      ElMessage.error("发生未知错误");
      return Promise.reject("发生未知错误");
    }

    const { response, message } = error;
    if (response && response.data) {
      const { status, data } = response;
      handleCode(status, data.msg || message || "未知错误");
      return Promise.reject(error);
    } else {
      let errorMsg = "后端接口未知异常";

      if (message) {
        if (message === "Network Error") {
          errorMsg = "后端接口连接异常";
        } else if (message.includes("timeout")) {
          errorMsg = "后端接口请求超时";
        } else if (message.includes("Request failed with status code")) {
          const code = message.substr(message.length - 3);
          errorMsg = `后端接口${code}异常`;
        }
      }

      ElMessage.error(errorMsg);
      return Promise.reject(error);
    }
  }
);

export default instance;

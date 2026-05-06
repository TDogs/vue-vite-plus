// 应用配置
const appConfig = {
  // 数据来源： real (真实后端) | mock(本地模拟)
  dataSource: "real",
  // 真实接口后端地址
  realApiBaseUrl: "http://localhost:3000",
};

const serverConfig = {
  // 运行环境：development | production
  nodeEnv: "production",
  // 本地开发端口
  port: 2229,
};

const isRealApi = appConfig.dataSource === "real";
const isMockApi = appConfig.dataSource === "mock";

module.exports = {
  appConfig,
  serverConfig,
  isRealApi,
  isMockApi,
};

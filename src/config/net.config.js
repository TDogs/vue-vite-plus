/**
 * @description 导出默认网路配置
 **/
const { appConfig } = require("./app.config");

const network = {
  // 统一从 app.config.js 读取接口来源
  baseURL: appConfig.dataSource === "real"
    ? appConfig.realApiBaseUrl
    : process.env.NODE_ENV === "production"
    ? "./vab-mock-server"
    : "/vab-mock-server",
  //配后端数据的接收方式application/json;charset=UTF-8或者application/x-www-form-urlencoded;charset=UTF-8
  contentType: "application/json;charset=UTF-8",
  //消息框消失时间
  messageDuration: 3000,
  //最长请求时间
  requestTimeout: 15000,
  // 200 成功；300 业务失败（由页面自行提示）；其余 code 走拦截器
  successCode: [200, 300],
  //登录失效code（JWT 过期后端通常返回 401）
  invalidCode: 401,
  //无权限code
  noPermissionCode: 403,
};
module.exports = network;

const { handleRandomImage } = require("../utils");

/**
 * 开发环境 Mock：模拟上传成功，返回可访问的图片地址（不解析真实 multipart 文件体）
 */
module.exports = [
  {
    url: "/admin/upload",
    type: "post",
    response() {
      return {
        code: 200,
        msg: "success",
        data: {
          url: handleRandomImage(400, 600),
        },
      };
    },
  },
];

import request from "@/utils/request";

// 上传文件
export function uploadFile(file,id) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("id", id);
  return request({
    url: "/admin/auth/upload",
    method: "post",
    data: formData,
  });
}

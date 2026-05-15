import request from "@/utils/request";

export function uploadFile(file, id) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("id", id);
  return request({
    url: "/admin/upload",
    method: "post",
    data: formData,
  });
}

import request from "@/utils/request";
import { tokenName } from "@/config";

export function getMoviesList(params = {}) {
  return request({
    url: "/admin/movies",
    method: "get",
    params: {
      ...params,
    },
  });
}

// 删除
export function deleteMovieById(id) {
  return request({
    url: "/admin/movies/del/" + id,
    method: "post",
  });
}

// 更新（JSON）
export function updateMovieById(payload = {}) {
  return request({
    url: "/admin/movies/update/" + payload.id,
    method: "post",
    data: {
      ...payload,
    },
  });
}

// 更新（multipart：文件字段名 poster_url，与其余字段同一请求）
export function updateMovieByIdFormData(id, formData) {
  return request({
    url: "/admin/movies/update/" + id,
    method: "post",
    data: formData,
  });
}

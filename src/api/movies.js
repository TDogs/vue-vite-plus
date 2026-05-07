import request from "@/utils/request";
import { tokenName } from "@/config";

export function getMoviesList(params = {}) {
  return request({
    url: "/admin/auth/movies",
    method: "get",
    params: {
      ...params,
    },
  });
}

// 删除
export function deleteMovieById(id) {
  return request({
    url: "/admin/auth/movies/del/"+id,
    method: "post",
  });
}

// 更新
export function updateMovieById( payload = {}) {
  return request({
    url: "/admin/auth/movies/update/"+payload.id,
    method: "post",
    data: {
      ...payload,
    },
  });
}

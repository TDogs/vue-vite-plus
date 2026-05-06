import request from "@/utils/request";
import { tokenName } from "@/config";

export function getMoviesList(accessToken, params = {}) {
  return request({
    url: "/admin/auth/movies",
    method: "get",
    params: {
      [tokenName]: accessToken,
      ...params,
    },
  });
}

// 删除
export function deleteMovieById(accessToken, payload = {}) {
  return request({
    url: "/admin/auth/movies/delete",
    method: "post",
    data: {
      [tokenName]: accessToken,
      ...payload,
    },
  });
}

// 更新
export function updateMovieById(accessToken, payload = {}) {
  return request({
    url: "/admin/auth/movies/update/"+payload.id,
    method: "post",
    data: {
      [tokenName]: accessToken,
      ...payload,
    },
  });
}

import request from "@/utils/request";
import { tokenName } from "@/config";

export async function login(data) {
  return request({
    url: "/admin/login",
    method: "post",
    data,
  });
} 
// accessToken
export function getUserInfo(accessToken) {
  return request({
    url: "/admin/auth/info",
    method: "get",
    [tokenName]: accessToken,
  });
}

export function logout() {
  return request({
    url: "/admin/auth/logout",
    method: "post",
  });
}

export function register() {
  return request({
    url: "/register",
    method: "post",
  });
}

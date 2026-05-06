import request from "@/utils/request";

export function getSystemMenuTree(data = {}) {
  return request({
    url: "/system/menu/list",
    method: "post",
    data,
  });
}

export function createSystemMenu(data) {
  return request({
    url: "/system/menu/create",
    method: "post",
    data,
  });
}

export function updateSystemMenu(data) {
  return request({
    url: "/system/menu/update",
    method: "post",
    data,
  });
}

export function deleteSystemMenu(data) {
  return request({
    url: "/system/menu/delete",
    method: "post",
    data,
  });
}


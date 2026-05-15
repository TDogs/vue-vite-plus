import request from "@/utils/request";

export function getGoodsList(params = {}) {
  return request({
    url: "/admin/goods",
    method: "get",
    params: {
      ...params,
    },
  });
}

export function deleteGoodsById(id) {
  return request({
    url: "/admin/goods/del/" + id,
    method: "post",
  });
}


export function updateGoodsById(payload = {}) {
  return request({
    url: "/admin/goods/" + payload.id,
    method: "put",
    data: {
      ...payload,
    },
  });
}

export function addGoods(payload = {}) {
  return request({
    url: "/admin/goods",
    method: "post",
    data: {
      ...payload,
    },
  });
}
export function getCategoriesList(params = {}) {
  return request({
    url: "/admin/categories",
    method: "get",
    params: {
      ...params,
    },
  });
}

export function getCategoriesTree(params = {}) {
  return request({
    url: "/admin/select_categories",
    method: "get",
    params: {
      ...params,
    },
  });
}

// 删除
export function deleteCategoryById(id) {
  return request({
    url: "/admin/categories/del/" + id,
    method: "post",
  });
}

// 更新（JSON）
export function updateCategoryById(payload = {}) {
  return request({
    url: "/admin/categories/" + payload.id,
    method: "put",
    data: {
      ...payload,
    },
  });
}

export function addCategory(payload = {}) {
  console.log("=========addCategory=======", payload);

  return request({
    url: "/admin/categories",
    method: "post",
    data: {
      ...payload,
    },
  });
}


export function getAttributesList(params = {}) {
  console.log("=========getAttributesList request=======", params);
  return request({
    url: "/admin/attributes",
    method: "get",
    params: {
      ...params,
    },
  });
}


// 删除
export function deleteAttributeById(id) {
  return request({
    url: "/admin/attributes/del/" + id,
    method: "post",
  });
}

// 更新（JSON）
export function updateAttributeById(payload = {}) {
  return request({
    url: "/admin/attributes/" + payload.id,
    method: "put",
    data: {
      ...payload,
    },
  });
}
export function addAttribute(payload = {}) {
  return request({
    url: "/admin/attributes",
    method: "post",
    data: {
      ...payload,
    },
  });
}

export function getAttributeOptions(params = {}) {
  return request({
    url: "/admin/attribute_options",
    method: "get",
    params: {
      ...params,
    },
  });
}

export function getAttributeOptionsByCategoryId(category_id) {
  return request({
    url: "/admin/selected_attributes_by_category_id/" + category_id,
    method: "get",
  });
}
export function updateCategoryAttributeById(payload = {}) {
  return request({
    url: "/admin/update_category_attribute_by_id/" + payload.category_id,
    method: "put",
    data: {
      ...payload,
    },
  });
}
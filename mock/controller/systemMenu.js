const { mock, Random } = require("mockjs");

function nowId() {
  return Random.id();
}

/**
 * In-memory menu store (lives for dev-server process lifetime).
 * Max depth: 2 (top-level + second-level).
 *
 * Shape:
 * { id, title, path, icon, sort, parentId }
 */
let menuList = [
  { id: "1000", title: "系统管理", path: "/system", icon: "cog", sort: 10, parentId: null },
  { id: "1001", title: "菜单管理", path: "/system/menu", icon: "list", sort: 10, parentId: "1000" },
];

function buildTree(list) {
  const byId = new Map();
  list.forEach((x) => byId.set(x.id, { ...x, children: [] }));
  const roots = [];
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  // sort
  const sortFn = (a, b) => (a.sort || 0) - (b.sort || 0);
  const deepSort = (nodes) => {
    nodes.sort(sortFn);
    nodes.forEach((n) => n.children && deepSort(n.children));
  };
  deepSort(roots);
  return roots;
}

function getParent(id) {
  return menuList.find((x) => x.id === id) || null;
}

function ensureMaxDepth(parentId) {
  if (!parentId) return;
  const parent = getParent(parentId);
  if (!parent) throw new Error("父级菜单不存在");
  if (parent.parentId) throw new Error("最多支持二级菜单（父级必须为顶级菜单）");
}

module.exports = [
  {
    url: "/system/menu/list",
    type: "post",
    response() {
      return { code: 200, msg: "success", data: buildTree(menuList) };
    },
  },
  {
    url: "/system/menu/create",
    type: "post",
    response(config) {
      const body = config.body || {};
      const { title, path, icon = "", sort = 0, parentId = null } = body;
      if (!title || !path) return { code: 500, msg: "title/path不能为空" };
      try {
        ensureMaxDepth(parentId);
      } catch (e) {
        return { code: 500, msg: e.message };
      }
      const id = nowId();
      menuList.push({ id, title, path, icon, sort, parentId: parentId || null });
      return { code: 200, msg: "success", data: { id } };
    },
  },
  {
    url: "/system/menu/update",
    type: "post",
    response(config) {
      const body = config.body || {};
      const { id, title, path, icon = "", sort = 0, parentId = null } = body;
      if (!id) return { code: 500, msg: "id不能为空" };
      const idx = menuList.findIndex((x) => x.id === id);
      if (idx < 0) return { code: 500, msg: "菜单不存在" };
      try {
        ensureMaxDepth(parentId);
      } catch (e) {
        return { code: 500, msg: e.message };
      }
      // prevent setting itself as parent
      if (parentId === id) return { code: 500, msg: "父级不能是自己" };
      menuList[idx] = { ...menuList[idx], title, path, icon, sort, parentId: parentId || null };
      return { code: 200, msg: "success" };
    },
  },
  {
    url: "/system/menu/delete",
    type: "post",
    response(config) {
      const body = config.body || {};
      const { id } = body;
      if (!id) return { code: 500, msg: "id不能为空" };
      // delete self + children
      const toDelete = new Set([id]);
      menuList.forEach((x) => {
        if (x.parentId === id) toDelete.add(x.id);
      });
      menuList = menuList.filter((x) => !toDelete.has(x.id));
      return { code: 200, msg: "success" };
    },
  },
];


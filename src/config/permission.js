/**
 * @author https://github.com/zxwk1998/vue-admin-better （不想保留author可删除）
 * @description 路由守卫，目前两种模式：all模式与intelligence模式
 */
import router, { asyncRoutes } from "@/router";
import store from "@/store";
import VabProgress from "nprogress";
import "nprogress/nprogress.css";
import getPageTitle from "@/utils/pageTitle";
import {
  authentication,
  loginInterception,
  progressBar,
  recordRoute,
  routesWhiteList,
} from "@/config";
import { ElMessage } from "element-plus";

function normalizePath(p) {
  if (!p || typeof p !== "string") return "";
  return p.startsWith("/") ? p : `/${p}`;
}

function collectMenuPaths(menus = []) {
  const set = new Set();
  const walk = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (!item) return;
      if (item.path) set.add(normalizePath(item.path));
      if (Array.isArray(item.children) && item.children.length) walk(item.children);
    });
  };
  walk(menus);
  return set;
}

function joinFullPath(parentFullPath, routePath) {
  if (!parentFullPath) return normalizePath(routePath);
  if (!routePath) return normalizePath(parentFullPath);
  const parent = parentFullPath.endsWith("/") ? parentFullPath.slice(0, -1) : parentFullPath;
  const child = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return normalizePath(parent + child);
}

function filterRoutesByMenuPaths(routes, pathSet, parentFullPath = "") {
  if (!Array.isArray(routes)) return [];
  const result = [];
  routes.forEach((route) => {
    if (!route) return;
    const item = { ...route };
    const routePath = item.path || "";
    const fullPath = routePath.startsWith("/")
      ? normalizePath(routePath)
      : joinFullPath(parentFullPath, routePath);

    const children = Array.isArray(item.children)
      ? filterRoutesByMenuPaths(item.children, pathSet, fullPath)
      : [];

    const leaf = fullPath
      ? normalizePath(fullPath.split("/").filter(Boolean).pop())
      : "";
    const matched =
      (!!fullPath && pathSet.has(fullPath)) || (!!leaf && pathSet.has(leaf));
    if (children.length > 0) {
      item.children = children;
      result.push(item);
    } else if (matched) {
      delete item.children;
      result.push(item);
    }
  });
  return result;
}

function buildMenuMetaMap(menus = []) {
  const metaMap = new Map();
  const leafMap = new Map();

  const walk = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach((item) => {
      if (!item || !item.path) return;
      const fullPath = normalizePath(item.path);
      metaMap.set(fullPath, { title: item.title, icon: item.icon });

      const leaf = normalizePath(item.path)
        .split("/")
        .filter(Boolean)
        .pop();
      if (leaf) leafMap.set(leaf, { title: item.title, icon: item.icon });

      if (Array.isArray(item.children) && item.children.length) {
        walk(item.children);
      }
    });
  };

  walk(menus);
  return { metaMap, leafMap };
}

function applyMenuMetaToRoutes(routes, metaMap, leafMap, parentFullPath = "") {
  if (!Array.isArray(routes) || routes.length === 0) return;
  routes.forEach((route) => {
    if (!route) return;

    const routePath = route.path || "";
    const fullPath = routePath.startsWith("/")
      ? normalizePath(routePath)
      : joinFullPath(parentFullPath, routePath);

    const meta = metaMap.get(fullPath) || leafMap.get(fullPath.split("/").filter(Boolean).pop());
    if (meta) {
      route.meta = route.meta || {};
      // icon 可能为 null，用 in 判断，保证后端想隐藏时也能生效
      if ("title" in meta) route.meta.title = meta.title;
      if ("icon" in meta) route.meta.icon = meta.icon;
    }

    if (Array.isArray(route.children) && route.children.length) {
      applyMenuMetaToRoutes(route.children, metaMap, leafMap, fullPath);
    }
  });
}

VabProgress.configure({
  easing: "ease",
  speed: 500,
  trickleSpeed: 200,
  showSpinner: false,
});

// 路由前置守卫 相当于中间件
router.beforeEach(async (to, from, next) => {
  if (progressBar) VabProgress.start();
  let hasToken = store.getters["user/accessToken"];

  if (!loginInterception) hasToken = true;

  if (hasToken) {
    if (to.path === "/login") {
      next({ path: "/" });
      if (progressBar) VabProgress.done();
    } else {
      const permissionsList = store.getters["user/permissions"];
      const menus = store.getters["user/menus"];
      const hasPermissions =
        Array.isArray(permissionsList) && permissionsList.length > 0;
      const hasMenus = Array.isArray(menus) && menus.length > 0;
      const routesState = store.getters["routes/routes"];
      const hasRoutes = Array.isArray(routesState) && routesState.length > 0;

      console.log("=========permission guard=========");
      console.log({
        to: to.path,
        hasToken,
        hasPermissions,
        hasMenus,
        hasRoutes,
        permissionsList,
        menus,
        routesState,
      });
      console.log("=========permission guard=========");

      // 真实接口模式可能只依赖 menus；模拟模式通常依赖 permissions
      // 如果 menus/permissions 有了，但 routes 仓库还没生成（routesState 为空），需要重新生成
      if ((hasPermissions || hasMenus) && hasRoutes) {
        next();
      } else {
        try {
          let permissions;
          if (!loginInterception) {
            //settings.js loginInterception为false时，创建虚拟权限
            await store.dispatch("user/setPermissions", ["admin"]);
            permissions = ["admin"];
          } else {
            permissions = await store.dispatch("user/getUserInfo");
            if (!permissions) {
              throw new Error("获取用户权限失败");
            }
          }

          let accessRoutes = [];
          const menus = store.getters["user/menus"];
          if (Array.isArray(menus) && menus.length > 0) {
            const menuPathSet = collectMenuPaths(menus);
            accessRoutes = filterRoutesByMenuPaths(asyncRoutes, menuPathSet);

            // 让侧边栏标题/图标跟随后端菜单 title/icon，而不是使用路由 meta.title
            const { metaMap, leafMap } = buildMenuMetaMap(menus);
            applyMenuMetaToRoutes(accessRoutes, metaMap, leafMap);

            // 让页面侧边栏/标签页从 routes 仓库读取
            store.commit("routes/setRoutes", accessRoutes);
          } else if (authentication === "intelligence") {
            accessRoutes = await store.dispatch(
              "routes/setRoutes",
              permissions
            );
          } else if (authentication === "all") {
            accessRoutes = await store.dispatch("routes/setAllRoutes");
          }

          // 确保accessRoutes是数组
          if (!Array.isArray(accessRoutes)) {
            console.error("路由数据格式错误:", accessRoutes);
            accessRoutes = [];
          }
          console.log("=========accessRoutes generated=========");
          console.log(accessRoutes);
          console.log("=========accessRoutes generated=========");

          // 添加路由
          accessRoutes.forEach((item) => {
            router.addRoute(item);
          });

          // 确保路由添加完成后，跳转到目标页面
          next({ ...to, replace: true });
        } catch (error) {
          console.error("路由守卫错误:", error);
          ElMessage.error(error.message || "发生错误，请重新登录");
          await store.dispatch("user/resetAccessToken");
          next(`/login?redirect=${to.path}`);
          if (progressBar) VabProgress.done();
        }
      }
    }
  } else {
    // 检查是否有保存的路由信息（页面刷新场景）
    const savedRoute = sessionStorage.getItem('currentRoute');
    if (savedRoute) {
      try {
        const routeInfo = JSON.parse(savedRoute);
        // 如果目标路由不在白名单中，仍然需要登录
        if (routesWhiteList.indexOf(to.path) !== -1) {
          next();
        } else {
          // 检查当前路径是否需要登录
          if (recordRoute) {
            next(`/login?redirect=${to.path}`);
          } else {
            next("/login");
          }
        }
      } catch (e) {
        console.error('解析保存的路由信息失败:', e);
        // 继续正常的登录检查流程
        if (routesWhiteList.indexOf(to.path) !== -1) {
          next();
        } else {
          if (recordRoute) {
            next(`/login?redirect=${to.path}`);
          } else {
            next("/login");
          }
        }
      }
    } else {
      if (routesWhiteList.indexOf(to.path) !== -1) {
        next();
      } else {
        if (recordRoute) {
          next(`/login?redirect=${to.path}`);
        } else {
          next("/login");
        }
      }
    }

    if (progressBar) VabProgress.done();
  }
  document.title = getPageTitle(to.meta.title);
});

router.afterEach(() => {
  if (progressBar) VabProgress.done();
});

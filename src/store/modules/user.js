/**
 * @author https://github.com/zxwk1998/vue-admin-better （不想保留author可删除）
 * @description 登录、获取用户信息、退出登录、清除accessToken逻辑，不建议修改
 */

import { getUserInfo, login, logout } from "@/api/user";
import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
} from "@/utils/accessToken";
import { resetRouter } from "@/router";
import { title, tokenName } from "@/config";
import { ElMessage } from "element-plus";

const state = () => ({
  accessToken: getAccessToken(),
  username: "",
  avatar: "",
  permissions: [],
  menus: [],
});
const getters = {
  accessToken: (state) => state.accessToken,
  username: (state) => state.username,
  avatar: (state) => state.avatar,
  permissions: (state) => state.permissions,
  menus: (state) => state.menus,
};
const mutations = {
  setAccessToken(state, accessToken) {
    state.accessToken = accessToken;
    setAccessToken(accessToken);
  },
  setUsername(state, username) {
    state.username = username;
  },
  setAvatar(state, avatar) {
    state.avatar = avatar;
  },
  setPermissions(state, permissions) {
    state.permissions = permissions;
  },
  setMenus(state, menus) {
    // 后端 menus 可能是数组，也可能是单个对象（顶级菜单）
    console.log("=========menus111========");
    console.log(state);
    console.log(menus);
    console.log("=========menus111========");

    if (Array.isArray(menus)) {
      state.menus = menus;
    } else if (menus && typeof menus === "object") {
      state.menus = [menus];
    } else {
      state.menus = [];
    }
  },
};
const actions = {
  setPermissions({ commit }, permissions) {
    commit("setPermissions", permissions);
  },

  async login({ commit }, userInfo) {
    const body = await login(userInfo);
    const accessToken = body?.[tokenName];
    console.log("========accessToken========");
    console.log(accessToken);
    if (accessToken) {
      commit("setAccessToken", accessToken); // 存 vuex + 持久化
      const hour = new Date().getHours();
      const thisTime =
        hour < 8
          ? "早上好"
          : hour <= 11
          ? "上午好"
          : hour <= 13
          ? "中午好"
          : hour < 18
          ? "下午好"
          : "晚上好";
      ElMessage.success(`欢迎登录${title}，${thisTime}！`);
    } else {
      ElMessage.error(`登录接口异常，未正确返回${tokenName}...`);
    }
  },
  async getUserInfo({ commit, state }) {
    try {
      const body = await getUserInfo(state.accessToken);
      const row = body.data;

      console.log("=========row========");
      console.log(row);
      console.log("=========row========");
      if (!row) {
        ElMessage.error("验证失败，请重新登录...");
        return false;
      }
      let { permissions, username, avatar } = row;
      const menus = row.menus || [];

      console.log("=========menus========");
      console.log(menus);
      console.log("=========menus========");
      const permissionsOk = Array.isArray(permissions);
      // 后端 avatar 为空时的兜底（沿用 mock 的默认头像列表第一张）
      const defaultAvatar =
        "https://gcore.jsdelivr.net/gh/zxwk1998/image/avatar/avatar_1.png";

      // 真实接口模式可能只关心 menus；模拟模式仍需 permissions
      if (username && (permissionsOk || (Array.isArray(menus) && menus.length > 0))) {
        console.log("=========permissionsOk========");
        console.log(permissionsOk);
        console.log("=========permissionsOk========");
        commit("setPermissions", permissionsOk ? permissions : []);
        commit("setUsername", username);
        commit("setAvatar", avatar || defaultAvatar);
        commit("setMenus", menus);
        console.log("=========setMenus========");
        console.log(menus);
        console.log("=========setMenus========");
        return permissionsOk ? permissions : menus;
      }

      ElMessage.error("用户信息接口异常");
      return false;
    } catch (error) {
      console.error("获取用户信息失败:", error);
      ElMessage.error("获取用户信息失败，请重新登录");
      return false;
    }
  },
  async logout({ dispatch, state }) {
    await logout(state.accessToken);
    await dispatch("resetAccessToken");
    await resetRouter();
    location.reload();
  },
  resetAccessToken({ commit }) {
    commit("setPermissions", []);
    commit("setMenus", []);
    commit("setAccessToken", "");
    removeAccessToken();
  },
};
export default { state, getters, mutations, actions };

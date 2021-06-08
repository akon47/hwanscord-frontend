import Vue from "vue";
import Vuex from "vuex";
import { signinUser } from "../api/auth";
import {
  getTokenFromLocalStorage,
  getUserFromLocalStorage,
  saveTokenToLocalStorage,
  saveUserToLocalStorage
} from "../utils/storage";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    username: getUserFromLocalStorage() || "",
    token: getTokenFromLocalStorage() || ""
  },
  getters: {
    isLogin(state) {
      return state.username !== "";
    }
  },
  mutations: {
    setUsername(state, username) {
      state.username = username;
    },
    clearUsername(state) {
      state.username = "";
    },
    setToken(state, token) {
      state.token = token;
    }
  },
  actions: {
    async Signin({ commit }, userData) {
      const { data } = await signinUser(userData);
      commit("setToken", data.token);
      commit("setUsername", data.user.username);
      saveTokenToLocalStorage(data.token);
      saveUserToLocalStorage(data.user.username);
      return data;
    }
  }
});

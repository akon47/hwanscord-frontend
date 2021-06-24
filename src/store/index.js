import Vue from "vue";
import Vuex from "vuex";
import { signinUser, signupUser } from "../api/auth";
import {
  getTokenFromLocalStorage,
  getUserFromLocalStorage,
  saveTokenToLocalStorage,
  saveUserToLocalStorage
} from "../utils/storage";
import socket from "../socket/index";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    username: getUserFromLocalStorage() || "",
    token: getTokenFromLocalStorage() || "",
    voiceChatSupported: false,
    joinedVoiceChannel:  "",
  },
  getters: {
    isLogin(state) {
      return state.username !== "";
    },
    isVoiceChatSupported(state) {
      return state.voiceChatSupported;
    },
    isVoiceChannelJoined(state) {
      return state.joinedVoiceChannel !== "";
    },
    joinedVoiceChannel(state) {
      return state.joinedVoiceChannel;
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
      if(socket.disconnected) {
        socket.connect();
      }
    },
    setVoiceChatSupported(state, supported) {
      state.voiceChatSupported = supported;
    },
    setJoinedVoiceChannel(state, channel) {
      state.joinedVoiceChannel = channel;
    },
    clearJoinedVoiceChannel(state) {
      state.joinedVoiceChannel = "";
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
    },
    async Signup({ commit }, userData) {
      const { data } = await signupUser(userData);
      commit("setToken", data.token);
      commit("setUsername", data.username);
      saveTokenToLocalStorage(data.token);
      saveUserToLocalStorage(data.username);
      return data;
    },
    Signout({ commit }) {
      commit("setToken", "");
      commit("clearUsername");
      saveTokenToLocalStorage("");
      saveUserToLocalStorage("");
    },
  }
});

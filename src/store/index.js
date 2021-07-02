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
    joinedVoiceChannel: "",
    userListVisible: true,
    mobileVisiblePage: "channels",
    localMediaStream: null,
    isJoiningVoiceChannel: false
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
    isVoiceChannelJoining(state) {
      return state.isJoiningVoiceChannel;
    },
    joinedVoiceChannel(state) {
      return state.joinedVoiceChannel;
    },
    isUserListVisible(state) {
      return state.userListVisible;
    },
    getMobileVisiblePage(state) {
      return state.mobileVisiblePage;
    },
    getLocalMediaStream(state) {
      return state.localMediaStream;
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
      if (socket.disconnected) {
        socket.connect();
      }
    },
    setVoiceChatSupported(state, supported) {
      state.voiceChatSupported = supported;
    },
    setJoinedVoiceChannel(state, channel) {
      state.joinedVoiceChannel = channel;
    },
    setJoiningVoiceChannelState(state, isJoining) {
      state.isJoiningVoiceChannel = isJoining;
    },
    clearJoinedVoiceChannel(state) {
      state.joinedVoiceChannel = "";
    },
    showUserList(state) {
      state.userListVisible = true;
    },
    hideUserList(state) {
      state.userListVisible = false;
    },
    setMobileVisiblePage(state, page) {
      state.mobileVisiblePage = page;
    },
    setLocalMediaStream(state, stream) {
      state.localMediaStream = stream;
    },
    clearLocalMediaStream(state) {
      if(state.localMediaStream) {
        state.localMediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }
      state.localMediaStream = null;
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
    async setupLocalMedia({ commit }) {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        commit("setLocalMediaStream", stream);
        console.log("Access granted to audio");
        return stream;
      } catch (error) {
        console.log("Access denied for audio", error);
        return null;
      }
    },
    async closeLocalMedia({ commit }) {
      commit("clearLocalMediaStream");
    }
  }
});

<template>
  <header>
    <div v-if="!$isMobile() || !isUserLogin">
      <router-link v-bind:to="logoLink" class="logo">
        HWANSCORD
        <span v-if="isUserLogin">by {{ $store.state.username }}</span>
      </router-link>
    </div>
    <div v-else class="mobile-header">
      <font-awesome-icon
        :icon="['fas', 'bars']"
        class="header-icon"
        @click.stop="selectChannelList"
        :class="{selected: isChannelAreaSelected}"
      />
      <font-awesome-icon
        :icon="['fas', 'users']"
        class="header-icon"
        @click.stop="selectUserList"
        :class="{selected: isUserAreaSelected}"
      />
    </div>
    <div class="navigations">
      <template v-if="isUserLogin">
        <a href="javascript:;" @click="logoutUser" class="logout-button">
          로그아웃
        </a>
      </template>
      <template v-else>
        <router-link to="/signin">로그인</router-link>
        <router-link to="/signup">회원가입</router-link>
      </template>
    </div>
  </header>
</template>

<script>
export default {
  computed: {
    isUserLogin() {
      return this.$store.getters.isLogin;
    },
    logoLink() {
      return this.$store.getters.isLogin ? "/main/@me" : "/";
    },
    isChannelAreaSelected() {
      return this.$store.getters.getMobileVisiblePage === "channels" ;
    },
    isUserAreaSelected() {
      return this.$store.getters.getMobileVisiblePage === "users" ;
    },
  },
  methods: {
    logoutUser() {
      if (this.$socket.client.connected) {
        this.$socket.client.disconnect();
      }
      this.$store.dispatch("Signout");
      this.$router.push("/signin");
    },
    selectChannelList() {
      this.$store.commit("setMobileVisiblePage", this.$store.getters.getMobileVisiblePage === "channels" ? "" : "channels");
    },
    selectUserList() {
      this.$store.commit("setMobileVisiblePage", this.$store.getters.getMobileVisiblePage === "users" ? "" : "users");
    },
  },
};
</script>

<style scoped>
.username {
  color: white;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #36393f;
  z-index: 2;
  height: 60px;
  filter: drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.6));
  border-bottom: 1px solid black;
}
a {
  color: #dedede;
  font-size: 18px;
}

a:hover {
  text-decoration: none;
}

a.logo {
  font-size: 30px;
  font-weight: 900;
  color: white;
}
.logo > span {
  font-size: 14px;
  font-weight: normal;
}
.navigations a {
  margin-left: 10px;
}
.fixed {
  position: fixed;
  top: 0;
  width: 100%;
}
.logout-button {
  font-size: 14px;
}
a.router-link-exact-active {
  color: white;
  font-weight: bold;
}

.mobile-header {
  color: darkgray;
}

.mobile-header .header-icon {
  margin: 6px;
}
.mobile-header .selected {
  color: white;
}
</style>

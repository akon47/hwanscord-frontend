<template>
  <div class="contents">
    <div class="form-wrapper form-wrapper-sm">
      <h1>로그인</h1>
      <form @submit.prevent="submitForm" class="form" :class="{ mobile: $isMobile() }">
        <div>
          <label for="username">유저이름 또는 별명</label>
          <input type="text" id="username" v-model="username" />
        </div>
        <div>
          <label for="password">비밀번호</label>
          <input
            type="text"
            id="password"
            v-model="password"
            autocomplete="off"
          />
        </div>
        <button
          v-bind:disabled="!isUsernameValid || !isPasswordValid"
          type="submit"
          class="btn"
        >
          로그인
        </button>
        <div class="signup-message">
          계정이 필요한가요? <router-link to="/signup">가입하기</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: "",
      password: "",
      logMessage: ""
    };
  },
  computed: {
    isUsernameValid() {
      return this.username.length > 0;
    },
    isPasswordValid() {
      return this.password.length > 0;
    }
  },
  methods: {
    async submitForm() {
      try {
        const userData = {
          username: this.username,
          password: this.password
        };
        await this.$store.dispatch("Signin", userData);
        this.$router.push("/main");
      } catch (error) {
        console.log(error);
        this.logMessage = error.response.data;
        alert(this.logMessage);
      } finally {
        this.initForm();
      }
    },
    initForm() {
      this.username = "";
      this.password = "";
    }
  }
};
</script>

<style>
.btn {
  color: white;
}
.signup-message {
  margin-top: 10px;
  font-size: 10pt;
  color: #8e9297;
}
.signup-message a {
  color: #00AFF4;
  text-decoration: none;
  font-weight: bold;
}
a:hover {
  text-decoration: underline;
}
</style>

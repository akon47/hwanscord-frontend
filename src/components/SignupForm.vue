<template>
  <div class="contents">
    <div class="form-wrapper form-wrapper-sm">
      <form @submit.prevent="submitForm" class="form">
        <div>
          <label for="username">username: </label>
          <input type="text" id="username" v-model="username" />
        </div>
        <div>
          <label for="password">password: </label>
          <input type="text" id="password" v-model="password" />
        </div>
        <button class="btn" type="submit">
          회원 가입
        </button>
        <p>{{ logMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script>
import { signupUser } from "../api/auth";

export default {
  data() {
    return {
      username: "",
      password: "",
      logMessage: ""
    };
  },
  methods: {
    async submitForm() {
      const userData = {
        username: this.username,
        password: this.password
      };
      const { data } = await signupUser(userData);
      console.log(data);
      this.logMessage = `${data.username}님이 가입되었습니다`;
      this.initForm();
      this.$router.push("/");
    },
    initForm() {
      this.username = "";
      this.password = "";
    }
  }
};
</script>

<style></style>

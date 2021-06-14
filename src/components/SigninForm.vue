<template>
  <div class="contents">
    <div class="form-wrapper form-wrapper-sm">
      <h2>로그인</h2>
      <form @submit.prevent="submitForm" class="form">
        <div>
          <input
            type="text"
            id="username"
            v-model="username"
            placeholder="Username"
          />
        </div>
        <div>
          <input
            type="text"
            id="password"
            v-model="password"
            placeholder="Password"
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
        <p>{{ logMessage }}</p>
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
      logMessage: "",
    };
  },
  computed: {
    isUsernameValid() {
      return this.username.length > 0;
    },
    isPasswordValid() {
      return this.password.length > 0;
    },
  },
  methods: {
    async submitForm() {
      try {
        const userData = {
          username: this.username,
          password: this.password,
        };
        await this.$store.dispatch("Signin", userData);
        this.$router.push("/main");
      } catch (error) {
        console.log(error);
        this.logMessage = error.response.data;
      } finally {
        this.initForm();
      }
    },
    initForm() {
      this.username = "";
      this.password = "";
    },
  },
};
</script>

<style>
.btn {
  color: white;
}
</style>

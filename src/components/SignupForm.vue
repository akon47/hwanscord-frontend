<template>
  <div class="contents">
    <div class="form-wrapper form-wrapper-sm">
      <h2>회원 가입</h2>
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
        <button v-bind:disabled="!isUsernameValid || !isPasswordValid || isLoading" class="btn" type="submit">
          회원 가입
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
      isLoading: false,
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
        this.isLoading = true;

        const userData = {
          username: this.username,
          password: this.password
        };
        await this.$store.dispatch("Signup", userData);
        this.initForm();
        this.$router.push("/main");
      } catch (error) {
        console.log(error);
        this.logMessage = error.response.data;
      } finally {
        this.isLoading = false;
      }
    },
    initForm() {
      this.username = "";
      this.password = "";
    }
  }
};
</script>

<style></style>

<template>
  <div class="contents">
    <div class="form-wrapper form-wrapper-sm">
      <form @submit.prevent="submitForm" class="form">
        <div>
          <label for="username">username: </label>
          <input type="text" id="username" v-model="username" />
          <!-- <p class="validation-text">
            <span class="warning" v-if="!isUsernameValid && username">
              Please enter an email address
            </span>
          </p> -->
        </div>
        <div>
          <label for="password">password: </label>
          <input type="text" id="password" v-model="password" />
        </div>
        <button type="submit" class="btn">
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
      logMessage: ""
    };
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
</style>

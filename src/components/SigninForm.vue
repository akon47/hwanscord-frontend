<template>
  <div>
    <b-card
      header="로그인"
      style="max-width: 40rem; margin: auto; margin-top: 10vh;"
      class="mb-2"
      border-variant="info"
      align="left"
    >
      <b-form @submit.prevent="submitForm">
        <b-form-group
          class="m-2"
          id="input-group-1"
          label="User name:"
          label-for="username"
        >
          <b-form-input
            id="username"
            v-model="username"
            type="text"
            placeholder="Enter username"
            required
          ></b-form-input>
        </b-form-group>

        <b-form-group
          class="m-2"
          id="input-group-2"
          label="User password:"
          label-for="password"
        >
          <b-form-input
            id="password"
            v-model="password"
            type="text"
            placeholder="Enter password"
            required
          ></b-form-input>
        </b-form-group>
        <b-button class="m-2" type="submit" variant="primary">로그인</b-button>
      </b-form>
    </b-card>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: "",
      password: ""
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
        this.$router.push("/chat");
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

<style></style>

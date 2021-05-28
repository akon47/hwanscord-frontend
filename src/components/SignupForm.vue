<template>
  <form @submit.prevent="submitForm">
    <div>
      <label for="username">username: </label>
      <input type="text" id="username" v-model="username" />
    </div>
    <div>
      <label for="password">password: </label>
      <input type="text" id="password" v-model="password" />
    </div>
    <button type="submit">회원 가입</button>
  </form>
</template>

<script>
import { registerUser } from '../api/index'

export default {
    data() {
        return {
            username: '',
            password: ''
        }
    },
    methods: {
        async submitForm() {
            const userData = {
                username: this.username,
                password: this.password,
            };
            const { data } = await registerUser(userData);
            console.log(data);
            this.logMessage = `${data.username}님이 가입되었습니다`;
            this.initForm();
        },
        initForm() {
            this.username = '';
            this.password = '';
        }
    }
}
</script>

<style>

</style>
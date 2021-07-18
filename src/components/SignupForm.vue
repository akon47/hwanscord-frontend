<template>
  <div class="contents">
    <div class="form-wrapper form-wrapper-sm">
      <h1>회원가입</h1>
      <form
        @submit.prevent="submitForm"
        class="form"
        :class="{ mobile: $isMobile() }"
      >
        <div>
          <label for="username">유저이름 또는 별명</label>
          <input type="text" id="username" v-model="username" />
        </div>
        <div>
          <label for="password">비밀번호</label>
          <input
            type="password"
            id="password"
            v-model="password"
            autocomplete="off"
          />
        </div>
        <div>
          <label for="password-repeat">비밀번호 확인</label>
          <input
            type="password"
            id="password-repeat"
            v-model="passwordRepeat"
            autocomplete="off"
          />
          <p v-if="passwordRepeat && !isPasswordRepeatValid">
            비밀번호 확인이 비밀번호와 다릅니다.
          </p>
        </div>
        <button
          :disabled="!isUsernameValid || !isPasswordValid || !isPasswordRepeatValid || isLoading"
          class="btn"
          type="submit"
        >
          회원가입
        </button>
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
      passwordRepeat: "",
      isLoading: false
    };
  },
  computed: {
    isUsernameValid() {
      return this.username.length > 0;
    },
    isPasswordValid() {
      return this.password.length > 0;
    },
    isPasswordRepeatValid() {
      return this.password === this.passwordRepeat;
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
        console.dir(error);
        if(error.response.status === 409) {
          alert("이미 존재하는 유저 이름입니다");
        } else {
          alert(error.response.statusText);
        }
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

<style scoped>
p {
  color: white;
  font-size: 10pt;
  margin-top: -15px;
  margin-left: 5px;
}
</style>

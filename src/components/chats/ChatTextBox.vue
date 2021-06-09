<template>
  <div class="chatinput">
    <form @submit.prevent="submitForm">
      <input type="text" id="message" v-model="message" autocomplete="off" />
      <button type="submit" class="btn">
        보내기
      </button>
    </form>
  </div>
</template>

<script>
import { sendMessage } from "../../api/messages";

export default {
  data() {
    return {
      message: ""
    };
  },
  methods: {
    async submitForm() {
      await sendMessage(this.message);
      this.clearMessage();
    },
    clearMessage() {
        this.message = '';
    }
  }
};
</script>

<style scoped>
.chatinput {
  font-family: inherit;
  font-size: 80%;
  width: calc(100% - 20px);
  border-radius: 5px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  padding-left: 10px;
  padding-right: 5px;
  padding-top: 5px;
  padding-bottom: 5px;
  margin: 10px;
  background-color: #656565;
}
.chatinput input {
  width: calc(100% - 120px - 10px);
  font-size: 80%;
  color: white;
}
.chatinput input:focus {
  outline: none;
}

.btn {
  color: white;
  background: #313131;
  padding: 0.5rem 1.5rem;
  font-weight: 700;
  border-radius: 5px;
  border: 0 solid #dae1e7;
  width: 120px;
  margin-left: 10px;
}
</style>

<template>
  <div class="chatinput">
    <div class="attachments">
      <label class="attachment-label" for="attachment">
        <font-awesome-icon class="icon" :icon="['fas', 'plus-square']" />
      </label>
      <input
        @change="handleFileChange"
        id="attachment"
        class="attachment-file"
        type="file"
        style="
          position: absolute;
          top: 0px;
          left: 0px;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        "
      />
    </div>
    <span>
      <form @submit.prevent="submitForm" style="margin-left: 50px">
        <input type="text" id="message" v-model="message" autocomplete="off" />
        <button type="submit" class="btn">보내기</button>
      </form>
    </span>
  </div>
</template>

<script>
import { sendMessage } from "../../api/messages";
import { uploadFile } from "../../api/attachment";
import { apiUrl } from "../../api/index";

export default {
  props: {
    channelId: {
      type: String,
    },
  },
  data() {
    return {
      message: "",
    };
  },
  methods: {
    async submitForm() {
      if (this.message !== "") {
        await sendMessage(this.channelId, this.message);
        this.clearMessage();
      }
    },
    clearMessage() {
      this.message = "";
    },
    async handleFileChange(e) {
      const file = e.target.files[0];
      try {
        const { data } = await uploadFile(file);
        await sendMessage(this.channelId, `${apiUrl}${data.filepath}`);
      } catch (error) {
        alert(error.response.statusText);
      }
    },
  },
};
</script>

<style scoped>
.icon {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  padding: 10px;
  margin-left: 3px;
  color: #b9bbbe;
  transition: 0.2s;
}
.icon:hover {
  color: #dcddde;
}

.attachment-label {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  cursor: pointer;
  z-index: 1000;
}

.attachments {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 50px;
  height: 100%;
  cursor: pointer;
}

.chatinput {
  position: relative;
  font-family: inherit;
  font-size: 80%;
  width: calc(100% - 20px);
  border-radius: 5px;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.1);
  padding-left: 6px;
  padding-right: 5px;
  padding-top: 5px;
  padding-bottom: 5px;
  margin: 10px;
  background-color: #40444b;
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
  transition: 0.2s;
}

.btn:hover {
  background: #212121;
}
</style>

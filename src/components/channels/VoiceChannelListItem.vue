<template>
  <div>
    <div class="root" :class="{ selected: isJoined }" @click="click">
      <span class="header">
        <font-awesome-icon :icon="['fas', 'volume-up']" style="color: gray" />
        {{ channelData.channelName }}
      </span>
      <div v-if="isMyChannel">
        <context-menu
          class="context-menu"
          v-model="isMenuOpened"
          :menuItems="menuItems"
        />
        <font-awesome-icon
          class="icon"
          :icon="['fas', 'cog']"
          @click.stop="menuClick"
        />
      </div>
    </div>
  </div>
</template>

<script>
import ContextMenu from "../common/ContextMenu.vue";
import {
  modifyVoiceChannel,
  deleteVoiceChannel,
} from "../../api/voiceChannels";
import { join } from "../../socket/voice";

export default {
  components: {
    ContextMenu,
  },
  props: {
    channelData: {
      type: Object,
      require: true,
    },
  },
  data() {
    return {
      isMenuOpened: false,
      menuItems: [
        { header: "수정", callback: () => this.modify() },
        { header: "삭제", callback: () => this.delete() },
      ],
    };
  },
  methods: {
    click() {
      join(this.channelData._id, { username: this.$store.state.username });
      console.log(navigator);
    },
    menuClick() {
      this.isMenuOpened = true;
    },
    async modify() {
      const channelName = prompt(
        "채널 이름 수정",
        this.channelData.channelName
      );
      if (channelName) {
        await modifyVoiceChannel(this.channelData._id, channelName);
      }
    },
    async delete() {
      await deleteVoiceChannel(this.channelData._id);
    },
  },
  computed: {
    isMyChannel() {
      return this.channelData.createdBy.username === this.$store.state.username;
    },
    isJoined() {
      return false;
    },
  },
};
</script>

<style scoped>
.context-menu {
  position: absolute;
  width: 100px;
  right: 30px;
  z-index: 1000;
}

.icon {
  color: #b9bbbe;
  transition: 0.2s;
}
.icon:hover {
  color: #dcddde;
}

.header {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.root {
  display: flex;
  position: relative;
  width: calc(100% - 10px);
  padding: 3px;
  margin: 5px;
  background-color: transparent;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13pt;
  font-weight: bold;
  color: darkgray;
  padding-left: 15px;
  justify-content: space-between;
}

.root:hover {
  background-color: rgb(52, 55, 60);
  color: white;
}

.selected {
  background-color: rgb(57, 60, 67);
  color: white;
}

.selected:hover {
  background-color: rgb(57, 60, 67);
}
</style>

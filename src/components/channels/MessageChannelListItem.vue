<template>
  <div class="root" :class="{ selected: isSelected }" @click="click">
    <span class="header">
      <font-awesome-icon :icon="['fas', 'hashtag']" style="color: gray"/>
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
        v-tooltip="'채널 편집'"
      />
    </div>
  </div>
</template>

<script>
import ContextMenu from "../common/ContextMenu.vue";
import { modifyChannel, deleteChannel } from "../../api/channels"

export default {
  components: {
    ContextMenu,
  },
  props: {
    channelId: {
      type: String,
    },
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
      if (!this.isSelected) {
        this.$router.push(`/main/${this.channelData._id}`);
        if(this.$isMobile()) {
          this.$store.commit("setMobileVisiblePage", "");
        }
      }
    },
    menuClick() {
      this.isMenuOpened = true;
    },
    async modify() {
      const channelName = prompt("채널 이름 수정", this.channelData.channelName);
      if (channelName) {
        await modifyChannel(this.channelData._id, channelName);
      }
    },
    async delete() {
      await deleteChannel(this.channelData._id);
    },
  },
  computed: {
    isSelected() {
      return this.channelId === this.channelData._id;
    },
    isMyChannel() {
      return this.channelData.createdBy.username === this.$store.state.username;
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
  padding: 5px;
  margin: 5px;
  background-color: transparent;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  line-height: 20px;
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

:focus { outline: none; }
</style>

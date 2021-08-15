import { mount } from "@vue/test-utils";
import "../../fontAwesomeIcon.js";

import ChatTextBox from "./ChatTextBox.vue";

describe("ChatTextBox.vue", () => {
  test("message가 입력되지 않으면 보내기 버튼이 비활성화 된다.", () => {
    const wrapper = mount(ChatTextBox, {
      data() {
        return {
          message: "",
        };
      },
    });
    const button = wrapper.find(".btn");
    expect(button.element.disabled).toBeTruthy();
  });
});

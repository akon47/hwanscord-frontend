import { mount } from "@vue/test-utils";
import SigninForm from "./SigninForm.vue";
import router from "../routes/index";

describe("SigninForm.vue", () => {
  test("username과 password가 입력되지 않으면 로그인 버튼이 비활성화 된다.", () => {
    const wrapper = mount(SigninForm, {
      data() {
        return {
          username: "",
          password: ""
        };
      },
      router
    });
    const button = wrapper.find(".btn");
    expect(button.element.disabled).toBeTruthy();
  });
});

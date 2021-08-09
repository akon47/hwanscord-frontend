import { mount } from "@vue/test-utils";
import SignupForm from "./SignupForm.vue";
import router from "../routes/index";

describe("SignupForm.vue", () => {
  test("username과 password가 입력되지 않으면 로그인 버튼이 비활성화 된다.", () => {
    const wrapper = mount(SignupForm, {
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
  test("username이 입력되지 않으면 로그인 버튼이 비활성화 된다.", () => {
    const wrapper = mount(SignupForm, {
      data() {
        return {
          username: "",
          password: "test"
        };
      },
      router
    });
    const button = wrapper.find(".btn");
    expect(button.element.disabled).toBeTruthy();
  });
  test("password가 입력되지 않으면 로그인 버튼이 비활성화 된다.", () => {
    const wrapper = mount(SignupForm, {
      data() {
        return {
          username: "test",
          password: ""
        };
      },
      router
    });
    const button = wrapper.find(".btn");
    expect(button.element.disabled).toBeTruthy();
  });
});

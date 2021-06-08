import { instance } from "./index";

function signupUser(userData) {
  return instance.post("/signup", userData);
}

function signinUser(userData) {
  return instance.post('/signin', userData);
}

export { signupUser, signinUser };

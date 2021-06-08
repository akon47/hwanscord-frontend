import axios from "axios";
import { setInterceptors } from "./common/interceptors";

const apiUrl = 'https://kimhwan.kr/hwanscord-backend/';

function createInstance() {
  const instance = axios.create({
    baseURL: apiUrl
  });
  return instance;
}

function createInstanceWithAuth(url) {
  const instance = axios.create({
    baseURL: `${apiUrl}${url}`
  });
  return setInterceptors(instance);
}

export const instance = createInstance();
export const chat = createInstanceWithAuth('chat');
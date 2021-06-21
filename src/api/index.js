import axios from "axios";
import { setInterceptors } from "./common/interceptors";

export const apiUrl = 'https://kimhwan.kr/hwanscord-backend/';

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
export const channels = createInstanceWithAuth('channels');
export const messages = createInstanceWithAuth('messages');
export const users = createInstanceWithAuth('users');
export const avatar = createInstanceWithAuth('avatar');
export const attachments = createInstanceWithAuth('attachments');
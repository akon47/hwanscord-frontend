import { io } from "socket.io-client";
import store from "../store/index";

const socketUrl = "wss://kimhwan.kr/";

const socket = io(socketUrl, {
  path: "/hwanscord-backend/socket.io/",
  withCredentials: true,
  auth: cb => {
    cb({
      token: store.state.token
    });
  },
  autoConnect: true
});

export default socket;

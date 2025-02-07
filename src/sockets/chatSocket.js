import { io } from "socket.io-client";

const SOCKET_URL = `${process.env.REACT_APP_SERVER_URL}`;
const chatSocket = io(SOCKET_URL);

export default chatSocket;

import { io } from "socket.io-client";


const SOCKET_URL = `${process.env.SERVER_URL}`;
const socket = io(SOCKET_URL);

export default socket;

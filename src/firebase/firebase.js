
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArFU5EQUxLvUU9Oz6npazlZ0iNqr1FghY",
  authDomain: "chat-app-8f477.firebaseapp.com",
  projectId: "chat-app-8f477",
  storageBucket: "chat-app-8f477.firebasestorage.app",
  messagingSenderId: "1068496897222",
  appId: "1:1068496897222:web:e107ff71bea406165d43c7",
  measurementId: "G-7K36TLM4SG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)

export {app , auth}
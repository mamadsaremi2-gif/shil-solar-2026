import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "SHIL_API_KEY",
  authDomain: "SHIL.firebaseapp.com",
  projectId: "shil-v15",
  storageBucket: "shil-v15.appspot.com",
  messagingSenderId: "000000000",
  appId: "1:000000000:web:000000000",
};

export const firebaseApp =
  initializeApp(firebaseConfig);

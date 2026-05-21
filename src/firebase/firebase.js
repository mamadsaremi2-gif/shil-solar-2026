import { initializeApp }
from "firebase/app";

const firebaseConfig = {

  apiKey:
    "SHIL_FIREBASE_KEY",

  authDomain:
    "shil-v15.firebaseapp.com",

  projectId:
    "shil-v15",

};

export const firebaseApp =
  initializeApp(firebaseConfig);

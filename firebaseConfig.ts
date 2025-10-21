import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAzRdyDJ67K2ri25gTYUELiOApEDO4dpCk",
  authDomain: "csm-task-hub.firebaseapp.com",
  projectId: "csm-task-hub",
  storageBucket: "csm-task-hub.firebasestorage.app",
  messagingSenderId: "393607880679",
  appId: "1:393607880679:web:fc097db72df67ebfa0e742",
  measurementId: "G-K3N8343E44"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyCXfZfCp5cOkVDqWPKEUbAz26jMhjIE4Wk",
  authDomain: "campusq-d067e.firebaseapp.com",
  projectId: "campusq-d067e",
  storageBucket: "campusq-d067e.firebasestorage.app",
  messagingSenderId: "530183860086",
  appId: "1:530183860086:web:3ebd6e60aab5c117dcd457",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

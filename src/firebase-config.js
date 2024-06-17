// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBO-a8mG-IivsLcJmUtGjfo2VkjId23TiM",
  authDomain: "enigma-software-consulting.firebaseapp.com",
  projectId: "enigma-software-consulting",
  storageBucket: "enigma-software-consulting.appspot.com",
  messagingSenderId: "546722245999",
  appId: "1:546722245999:web:9cc37f6b6452ec80eb4c9a",
  measurementId: "G-CP5M924QYS"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
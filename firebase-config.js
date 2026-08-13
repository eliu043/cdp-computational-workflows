// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBbS1iUuhW-aNnG8r_t_R--DtoeFHMDDSs",
  authDomain: "agent-5638c.firebaseapp.com",
  projectId: "agent-5638c",
  storageBucket: "agent-5638c.firebasestorage.app",
  messagingSenderId: "879250066117",
  appId: "1:879250066117:web:959d0c0ccf8d7ec4aebeac",
  measurementId: "G-N66FXCDV80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
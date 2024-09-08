// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCSZm-Ik-QrY7QAm9nLakx0mB1oxhzeM5g",
  authDomain: "dashboard-energia.firebaseapp.com",
  projectId: "dashboard-energia",
  storageBucket: "dashboard-energia.appspot.com",
  messagingSenderId: "700735545910",
  appId: "1:700735545910:web:4f57baf2fa12480f216e97",
  measurementId: "G-Q303T841JD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
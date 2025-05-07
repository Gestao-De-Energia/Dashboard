// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
    apiKey: "AIzaSyCSZm-Ik-QrY7QAm9nLakx0mB1oxhzeM5g",
    authDomain: "dashboard-energia.firebaseapp.com",
    databaseURL: "https://dashboard-energia-default-rtdb.firebaseio.com",
    projectId: "dashboard-energia",
    storageBucket: "dashboard-energia.appspot.com",
    messagingSenderId: "700735545910",
    appId: "1:700735545910:web:4f57baf2fa12480f216e97",
    measurementId: "G-Q303T841JD"
};
  


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (window.location.hostname === "localhost") {
    connectFirestoreEmulator(db, "localhost", 8080);
    console.log("Conectado ao Firestore Emulator!");
}
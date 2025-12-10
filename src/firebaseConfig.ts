// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAx7t5VwHdVNjsMhD_oKWBTN6avV1_rV3E",
  authDomain: "bidapro-87005.firebaseapp.com",
  projectId: "bidapro-87005",
  storageBucket: "bidapro-87005.firebasestorage.app",
  messagingSenderId: "223285139352",
  appId: "1:223285139352:web:6eac502097de15f0da3ded",
  measurementId: "G-TKXNPRH4HJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
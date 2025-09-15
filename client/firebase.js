// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBZOoYzdysB39jLLXfxD2yVEizL2gfkYME",
  authDomain: "waleki-c7071.firebaseapp.com",
  databaseURL: "https://waleki-c7071-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "waleki-c7071",
  storageBucket: "waleki-c7071.firebasestorage.app",
  messagingSenderId: "1083143732092",
  appId: "1:1083143732092:web:497767d35feac1b33c02f9",
  measurementId: "G-DH16QXZMEH"
};

// Initialize Firebase
let app;
let analytics;
let database;
let auth;
let firestore;
let storage;

try {
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase services
  analytics = getAnalytics(app);
  database = getDatabase(app); // Realtime Database
  auth = getAuth(app);
  firestore = getFirestore(app); // Firestore
  storage = getStorage(app);
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  throw new Error(`Firebase initialization failed: ${error.message}`);
}

export { analytics, database, auth, firestore, storage };
export default app;

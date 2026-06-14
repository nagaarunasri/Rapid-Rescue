// ===========================================================
// Firebase Configuration & Initialization
// Replace the config object below with your own Firebase
// project credentials (Project Settings > General > Your apps)
// ===========================================================

const firebaseConfig = {
  apiKey: "AIzaSyB3eK2QFwkcNqWZubYF9CfSQ2FNiZwnFLM",
  authDomain: "rapid-rescue-68230.firebaseapp.com",
  projectId: "rapid-rescue-68230",
  storageBucket: "rapid-rescue-68230.firebasestorage.app",
  messagingSenderId: "470170751627",
  appId: "1:470170751627:web:38908995c6ced35e2cba8e",
  measurementId: "G-93VQYGT1KJ"
};

// Initialize Firebase (compat SDK loaded via CDN in each HTML file)
firebase.initializeApp(firebaseConfig);

// Shortcuts used across the app
const auth = firebase.auth();
const db = firebase.database();

// Database collection references (as per spec)
const refTrafficData   = db.ref("trafficData");
const refAlerts        = db.ref("alerts");
const refRoutes        = db.ref("routes");
const refAnalytics     = db.ref("analytics");
const refAmbulances    = db.ref("ambulances");
const refUsers         = db.ref("users");
const refEmergencyCases= db.ref("emergencyCases");

// Google Auth provider
const googleProvider = new firebase.auth.GoogleAuthProvider();

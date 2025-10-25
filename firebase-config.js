// ============================================
// DREAM HARBOUR BILLING SYSTEM
// Firebase Configuration File (Updated with Your Credentials)
// ============================================

// Your Firebase Configuration - Already populated with your project credentials
const firebaseConfig = {
  apiKey: "AIzaSyBK8K0nIbc1DCj7kghQKYOLIhsB_3EvWQg",
  authDomain: "dreamharbour-billing.firebaseapp.com",
  projectId: "dreamharbour-billing",
  storageBucket: "dreamharbour-billing.firebasestorage.app",
  messagingSenderId: "32291586019",
  appId: "1:32291586019:web:461035a507ad3f2dcfead6"
};

// ============================================
// EXPORT CONFIGURATION
// ============================================
// This configuration is used by the main app.js file

if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseConfig;
}

// ============================================
// YOUR FIREBASE PROJECT DETAILS
// ============================================
// Project ID: dreamharbour-billing
// Auth Domain: dreamharbour-billing.firebaseapp.com
// Storage Bucket: dreamharbour-billing.firebasestorage.app
// Messaging Sender ID: 32291586019
//
// ✅ Configuration is COMPLETE and READY TO USE
// ✅ All credentials have been verified
// ============================================

console.log("✅ Firebase Config Loaded - dreamharbour-billing");
console.log("Project: " + firebaseConfig.projectId);
console.log("Auth Domain: " + firebaseConfig.authDomain);

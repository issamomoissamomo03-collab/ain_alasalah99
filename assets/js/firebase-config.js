// assets/js/firebase-config.js
// أدخل إعدادات مشروعك من Firebase console > Project settings > General > Your apps (Web)
const firebaseConfig = {
    apiKey: "AIzaSyCvKgf3wa5GTIdk3JtQtWNAOAhAGW4Vvpc",
    authDomain: "ain-alasaleh.firebaseapp.com",
    projectId: "ain-alasaleh",
    storageBucket: "ain-alasaleh.firebasestorage.app",
    messagingSenderId: "765185358579",
    appId: "1:765185358579:web:0a4d3b5e669abdd1695586",
    measurementId: "G-GMDSMV18VY"
  };
  
  // لا تغيّر الأسطر التالية
  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  
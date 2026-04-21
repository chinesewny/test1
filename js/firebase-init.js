/* ════════════════════════════════════════════
   firebase-init.js — Firebase initialization (plain JS)
   ════════════════════════════════════════════ */

firebase.initializeApp(window.firebaseConfig);
window.db      = firebase.firestore();
window.auth    = firebase.auth();
window.storage = firebase.storage();

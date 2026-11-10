importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBczQ9p_cHXCHnlf5U54EtK87Kf-M8mdSo",
  authDomain: "synthetic-energy-4xctm.firebaseapp.com",
  projectId: "synthetic-energy-4xctm",
  storageBucket: "synthetic-energy-4xctm.firebasestorage.app",
  messagingSenderId: "934033507912",
  appId: "1:934033507912:web:f66a3fdbfca710b5b7ba7d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || '/official-onebite-icon.png',
    badge: '/icon-192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

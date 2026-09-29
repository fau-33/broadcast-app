import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2Os_Bxy31_d_3CutpTDu0Tb2YQo2cISs",
  authDomain: "broadcast-app-a33bc.firebaseapp.com",
  projectId: "broadcast-app-a33bc",
  storageBucket: "broadcast-app-a33bc.firebasestorage.app",
  messagingSenderId: "398071454755",
  appId: "1:398071454755:web:21d3399809fdabc553e596",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

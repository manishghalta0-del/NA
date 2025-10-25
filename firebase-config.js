import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBK8K0nIbc1DCj7kghQKYOLIhsB_3EvWQg",
  authDomain: "dreamharbour-billing.firebaseapp.com",
  projectId: "dreamharbour-billing",
  storageBucket: "dreamharbour-billing.appspot.com",
  messagingSenderId: "32291586019",
  appId: "1:32291586019:web:461035a507ad3f2dcfead6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

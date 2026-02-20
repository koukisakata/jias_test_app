import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyBzGw0v3oxg8UoQ2bwqxm_vZtuhpvpvu6c",
  authDomain: "jias-it-j4touchui-dev.firebaseapp.com",
  projectId: "jias-it-j4touchui-dev",
  storageBucket: "jias-it-j4touchui-dev.firebasestorage.app",
  messagingSenderId: "26494441964",
  appId: "1:26494441964:web:c121180c2b8812f28a08c9",
  measurementId: "G-W385EH1P8C"
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const auth = getAuth(app);
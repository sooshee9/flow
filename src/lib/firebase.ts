import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDBgH3vn2ec1FwRRkVIG5gAR9Jkno5VCR4",
  authDomain: "maintenance-flow-1c30c.firebaseapp.com",
  projectId: "maintenance-flow-1c30c",
  storageBucket: "maintenance-flow-1c30c.appspot.com",
  messagingSenderId: "116876204407",
  appId: "1:116876204407:web:7641e3dbb7a48cd69c6972"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);



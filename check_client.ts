import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    console.log("Writing a test doc to integrations to see if it works...");
    await setDoc(doc(db, "test", "testwrite"), { time: new Date() });
    console.log("Write success!");
  } catch (err) {
    console.error("Write error:", err);
  }
}

run();

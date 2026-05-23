import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

admin.initializeApp({
  projectId: firebaseConfig.projectId
});

async function run() {
  try {
    console.log("Writing a test doc via Admin SDK...");
    await admin.firestore().collection("test").doc("admin_test").set({ time: new Date() });
    console.log("Admin write success!");
  } catch (err) {
    console.error("Admin write error:", err);
  }
}

run();

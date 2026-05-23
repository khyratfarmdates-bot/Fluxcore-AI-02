import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

admin.initializeApp({
  projectId: firebaseConfig.projectId
});

async function run() {
  try {
    const user = await admin.auth().getUserByEmail("khyratfarmdates@gmail.com");
    console.log("User UID:", user.uid);

    const integrations = await admin.firestore().collection("users").doc(user.uid).collection("integrations").get();
    
    if (integrations.empty) {
      console.log("No integrations found for user.");
    } else {
      integrations.forEach(doc => {
        console.log("Integration:", doc.id, "=>", JSON.stringify(doc.data(), null, 2));
      });
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();

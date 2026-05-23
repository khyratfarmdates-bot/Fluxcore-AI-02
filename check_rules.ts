import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { app } from "./src/lib/firebase";

async function test(dbId: string) {
  try {
    const db = getFirestore(app, dbId);
    console.log(`Testing DB ${dbId}...`);
    await setDoc(doc(db, "test", "test"), { hello: "world" });
    console.log(`Getting doc from ${dbId}...`);
    const snap = await getDoc(doc(db, "test", "test"));
    console.log(`Result from ${dbId}:`, snap.data());
  } catch (e: any) {
    console.error(`Error on ${dbId}:`, e.code, e.message);
  }
}

async function run() {
  await test("(default)");
  await test("ai-studio");
  await test("aistudio");
}
run();

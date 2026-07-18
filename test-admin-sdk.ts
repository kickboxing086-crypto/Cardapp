import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log("Env vars:", {
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    FIREBASE_CONFIG: process.env.FIREBASE_CONFIG,
    PROJECT_ID: process.env.PROJECT_ID || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT
  });
  
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    // Attempt 1: No app config, pure default initialization
    console.log("Attempting pure default initialization...");
    try {
      const appDefault = admin.initializeApp({}, 'default-init');
      const dbDefault = getFirestore(appDefault, firebaseConfig.firestoreDatabaseId);
      const snap = await dbDefault.collection('stores').get();
      console.log("SUCCESS on default-init! Doc count:", snap.size);
    } catch (e: any) {
      console.log("FAILED default-init:", e?.code, e?.message);
    }

    // Attempt 2: Initializing with explicitly specified credentials if available
    console.log("Attempting with default credentials + project info...");
    try {
      const appCred = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: firebaseConfig.projectId,
      }, 'cred-init');
      const dbCred = getFirestore(appCred, firebaseConfig.firestoreDatabaseId);
      const snap = await dbCred.collection('stores').get();
      console.log("SUCCESS on cred-init! Doc count:", snap.size);
    } catch (e: any) {
      console.log("FAILED cred-init:", e?.code, e?.message);
    }
  } else {
    console.log("No config file found");
  }
}

main();

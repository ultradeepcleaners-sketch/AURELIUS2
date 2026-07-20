import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom settings to handle gRPC / websocket RST_STREAM issues
// We force long polling for reliable stream persistence in containerized / proxied preview environments.
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || "(default)");

// Initialize Storage
const storage = getStorage(app);

export { app, db, storage };


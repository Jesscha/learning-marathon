import * as admin from "firebase-admin";

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
});

export default admin;
export const db = admin.firestore();

import * as admin from "firebase-admin";

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: 'learing-marathon.firebasestorage.app',
});

export default admin;
export const db = admin.firestore();
export const storageBucket = admin.storage().bucket();

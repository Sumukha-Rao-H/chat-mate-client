const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Replace this with the path to your service account key JSON file
const serviceAccount = require('../chat-app-8f477-firebase-adminsdk-i4r5u-f9a91f2fe4.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount), // Use service account for authentication
    });
}

module.exports = admin;

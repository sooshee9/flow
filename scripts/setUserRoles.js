// scripts/setUserRoles.js
// Usage: node setUserRoles.js
// Requires: Firebase Admin SDK (npm install firebase-admin)

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download from Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Map emails to roles
const userRoles = [
  { email: 'complaintentry@gmail.com', role: 'complaint' },
  { email: 'maintenanceentry@gmail.com', role: 'maintenance' },
  { email: 'sooshee9@gmail.com', role: 'admin' }
];

async function setUserRole(email, role) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await db.collection('users').doc(user.uid).set({ role });
    console.log(`Set role for ${email} (${user.uid}) to ${role}`);
  } catch (err) {
    console.error(`Failed to set role for ${email}:`, err.message);
  }
}

async function main() {
  for (const { email, role } of userRoles) {
    await setUserRole(email, role);
  }
  process.exit(0);
}

main();

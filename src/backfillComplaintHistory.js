// backfillComplaintHistory.js
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function backfillComplaintHistory() {
  const complaintsRef = db.collection('complaints');
  const snapshot = await complaintsRef.get();
  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!Array.isArray(data.history) || data.history.length === 0) {
      const createdAt = data.createdAt || data.timestamp || new Date();
      const user = data.createdBy || data.user || 'Unknown';
      const newHistory = [
        {
          action: 'Created',
          user,
          timestamp: createdAt,
        },
      ];
      await doc.ref.update({ history: newHistory });
      updatedCount++;
      console.log(`Backfilled history for complaint ${doc.id}`);
    }
  }
  console.log(`Backfill complete. Updated ${updatedCount} complaints.`);
}

backfillComplaintHistory().catch(console.error);
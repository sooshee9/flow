'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ComplaintForm } from '../../../../components/complaints/ComplaintForm';
import { db } from '../../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Complaint } from '../../../../types/complaint';

export default function EditComplaintPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [complaint, setComplaint] = useState<Complaint | null>(null);

  useEffect(() => {
    const fetchComplaint = async () => {
      const docRef = doc(db, 'complaints', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setComplaint({ id: docSnap.id, ...docSnap.data() } as Complaint);
      }
    };
    if (id) fetchComplaint();
  }, [id]);

  if (!complaint) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Edit Complaint</h1>
        <button onClick={() => router.push('/')}>Close</button>
      </div>
      <ComplaintForm complaint={complaint} onSuccess={() => router.push('/?refresh=1')} />
    </div>
  );
}
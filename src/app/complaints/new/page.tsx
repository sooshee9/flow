'use client';

import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { ComplaintForm } from '../../../components/complaints/ComplaintForm';

export default function NewComplaintPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Create Complaint</h1>
        <Button variant="outline" onClick={() => router.push('/')}>
          Close
        </Button>
      </div>
      <ComplaintForm onSuccess={() => router.push('/?refresh=1')} />
    </div>
  );
}
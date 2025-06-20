'use client';

import { ComplaintForm } from './ComplaintForm';

export default function NewComplaintPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-bold mb-4">Create Complaint</h1>
      <ComplaintForm onSuccess={() => {}} />
    </div>
  );
}
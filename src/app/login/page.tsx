// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useToast } from '../../hooks/use-toast';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Complaint } from '../../types/complaint';
import { ComplaintsClientPage } from '../../components/complaints/ComplaintsClientPage';
import { FirebaseError } from 'firebase/app';
import type { AssignedTo } from '../../lib/types';

export default function LoginPage() {
  const [email, setEmail] = useState('sooshee9@gmail.com');
  const [password, setPassword] = useState('123456789');
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    toast({ title: 'Login Attempt', description: 'Attempting to log in...' });
    console.log('[LoginPage] Login attempt for', email);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      console.log('[LoginPage] Firebase login success, uid:', uid);
      // Fetch user data
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      let role: 'admin' | 'user' = 'user';
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('[LoginPage] Firestore userDoc:', userData);
        if (userData.role === 'admin') {
          role = 'admin';
        } else {
          role = 'user';
        }
      } else {
        console.warn('[LoginPage] User profile not found in Firestore, defaulting to user role.');
        toast({
          title: 'Warning',
          description: 'User profile not found. Defaulting to user role.',
          variant: 'default',
        });
      }
      setUserRole(role);
      // Fetch complaints
      const complaintsCollection = collection(db, 'complaints');
      const complaintQuery = role === 'admin'
        ? complaintsCollection
        : query(complaintsCollection, where('createdBy', '==', email));
      const complaintSnapshot = await getDocs(complaintQuery);
      const complaintList: Complaint[] = complaintSnapshot.docs.map((doc) => {
        const data = doc.data();
        const validStatuses = ['Open', 'In Progress', 'Closed', 'Pending Parts'] as const;
        const complaintStatus = validStatuses.includes(data.complaintStatus)
          ? data.complaintStatus
          : 'Open';
        return {
          // Required by Complaint type
          complaintId: data.complaintId || doc.id,
          department: data.department || '',
          materialsUsed: data.materialsUsed || [],
          history: data.history || [],
          // Existing fields
          id: doc.id,
          userId: data.userId || '',
          complaintDate: data.complaintDate || '',
          machineName: data.machineName || '',
          complaintDescription: data.complaintDescription || '',
          priority: data.priority || 'Low',
          complaintStatus,
          actionDate: data.actionDate || null,
          maintenanceRemarks: data.maintenanceRemarks || null,
          initialInspectionDate: data.initialInspectionDate || null,
          estimatedEndDate: data.estimatedEndDate || null,
          finalizationDate: data.finalizationDate || null,
          createdBy: data.createdBy || '',
          assignedTo: (data.assignedTo as AssignedTo) || 'Person A',
        };
      });
      setComplaints(complaintList);
      console.log('[LoginPage] Complaints fetched:', complaintList);
      toast({
        title: 'Success',
        description: `Logged in as ${role}. Found ${complaintList.length} complaints.`,
      });
      router.push('/');
    } catch (error: any) {
      let message = 'Failed to log in. Please try again.';
      console.error('[LoginPage] Login error:', error);
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/invalid-credential':
            message = 'Invalid email or password.';
            break;
          case 'auth/user-disabled':
            message = 'This account has been disabled.';
            break;
          case 'auth/too-many-requests':
            message = 'Too many attempts. Please try again later.';
            break;
          case 'auth/network-request-failed':
            message = 'Network error. Please check your connection.';
            break;
          case 'permission-denied':
            message = 'Permission denied. Check Firestore rules or user data.';
            break;
          default:
            message = `Error: ${error.message}`;
        }
      }
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Complaints</h2>
        {complaints.length > 0 ? (
          <ComplaintsClientPage initialComplaints={complaints} />
        ) : (
          <p>No complaints found. Click "New Complaint" after logging in to create one.</p>
        )}
        {userRole && (
          <p className="mt-4">Logged in as: {userRole}</p>
        )}
      </div>
      <Button
        className="mt-4"
        onClick={() => toast({ title: 'Test', description: 'This is a test toast' })}
      >
        Test Toast
      </Button>
    </div>
  );
}
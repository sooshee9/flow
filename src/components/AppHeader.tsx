'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AppHeader() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div>
      {currentUser ? (
        <div>
          <span style={{ fontWeight: 600, fontSize: '1.1em', marginRight: '1em' }}>{currentUser.email || 'User'}</span>
          <button className="btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      ) : (
        <button className="btn" onClick={() => router.push('/login')}>
          Login
        </button>
      )}
    </div>
  );
}
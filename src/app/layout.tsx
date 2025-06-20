import { AuthProvider } from '../context/AuthContext';
import AppHeader from '../../src/components/AppHeader';
import { Toaster } from '../../src/components/ui/toaster';
import './globals.css';

export const metadata = {
  title: 'Maintenance Flow',
  description: 'Complaint Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="App">
        <AuthProvider>
          <div className="App-header">
            <h1>Maintenance Flow</h1>
            <AppHeader />
          </div>
          <main>{children}</main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
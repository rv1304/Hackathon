import { Dashboard } from '@/components/dashboard';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';

export default function Home() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <Dashboard />
      </div>
    </div>
  );
}

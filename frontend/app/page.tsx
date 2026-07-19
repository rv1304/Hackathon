'use client';

import { CommandCenter } from '@/components/command-center';

export default function Home() {
  return (
    <div className="w-full h-screen bg-background overflow-hidden">
      <CommandCenter />
    </div>
  );
}

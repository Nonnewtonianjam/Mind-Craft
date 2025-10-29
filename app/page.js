'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/flow');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="text-2xl font-semibold text-gray-800 mb-2">Mind-Craft</div>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    </div>
  );
}
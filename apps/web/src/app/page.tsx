'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const { me, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) router.replace(me ? '/dashboard' : '/login');
  }, [loading, me, router]);
  return <div className="flex min-h-screen items-center justify-center text-navy/50">Redirecting…</div>;
}

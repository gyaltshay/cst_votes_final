'use client';
import { usePathname } from 'next/navigation';
import MainLayout from '@/components/Layout/MainLayout';

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  return isAdmin ? children : <MainLayout>{children}</MainLayout>;
} 
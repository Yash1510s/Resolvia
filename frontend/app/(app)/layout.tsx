'use client';

import React from 'react';
import { AppProvider } from '../lib/app-context';
import { AppShell } from '../components/AppShell';

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}

'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — messages & notifications now live together in the Messages center. */
export default function NotificationsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/messages');
  }, [router]);
  return null;
}

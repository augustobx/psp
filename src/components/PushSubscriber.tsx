'use client';

import { useEffect } from 'react';

// VAPID PUBLIC KEY from .env
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushSubscriber() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && (window as any).workbox !== undefined) {
      // Setup push notifications
      const setupPush = async () => {
        try {
          const register = await navigator.serviceWorker.ready;
          
          if (!publicVapidKey) {
            console.warn('VAPID public key not found. Push notifications disabled.');
            return;
          }

          // Request permission
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            return;
          }

          let subscription = await register.pushManager.getSubscription();
          
          if (!subscription) {
            subscription = await register.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
            });
          }

          // Send subscription to backend
          await fetch('/api/push/subscribe', {
            method: 'POST',
            body: JSON.stringify({
              subscription,
              userId: 'ADMIN' // Hardcoded for now. In a real scenario, use actual admin user ID.
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
        } catch (error) {
          console.error('Error setting up push notifications:', error);
        }
      };

      setupPush();
    }
  }, []);

  return null; // Invisible component
}

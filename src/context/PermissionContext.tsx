import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { messaging, getToken } from '../services/firebase.ts';

type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

interface PermissionState {
  notifications: PermissionStatus;
  location: PermissionStatus;
  camera: PermissionStatus;
  microphone: PermissionStatus;
  photos: PermissionStatus;
}

interface PermissionContextType {
  permissions: PermissionState;
  requestPermission: (type: keyof PermissionState) => Promise<boolean>;
  checkPermissions: () => Promise<void>;
  isModalOpen: boolean;
  activePermissionRequest: keyof PermissionState | null;
  openPermissionModal: (type: keyof PermissionState) => void;
  closePermissionModal: () => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<PermissionState>({
    notifications: 'prompt',
    location: 'prompt',
    camera: 'prompt',
    microphone: 'prompt',
    photos: 'prompt',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePermissionRequest, setActivePermissionRequest] = useState<keyof PermissionState | null>(null);

  const checkPermissions = useCallback(async () => {
    const newState: PermissionState = { ...permissions };

    // Notifications
    if (!('Notification' in window)) {
      newState.notifications = 'unsupported';
    } else {
      newState.notifications = Notification.permission as PermissionStatus;
    }

    // Geolocation
    if (!('geolocation' in navigator)) {
      newState.location = 'unsupported';
    } else {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        newState.location = result.state as PermissionStatus;
      } catch (e) {
        newState.location = 'prompt';
      }
    }

    // Media permissions (Camera/Mic)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      newState.camera = 'unsupported';
      newState.microphone = 'unsupported';
    } else {
      try {
        const camResult = await navigator.permissions.query({ name: 'camera' as PermissionName });
        newState.camera = camResult.state as PermissionStatus;
        const micResult = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        newState.microphone = micResult.state as PermissionStatus;
      } catch (e) {
        // Fallback or ignore if query not supported for these
      }
    }

    setPermissions(newState);
  }, [permissions]);

  useEffect(() => {
    checkPermissions();
  }, []);

  const requestPermission = async (type: keyof PermissionState): Promise<boolean> => {
    try {
      if (type === 'notifications') {
        if (!('Notification' in window) || !messaging) return false;
        const result = await Notification.requestPermission();
        
        if (result === 'granted') {
          try {
            const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
            const token = await getToken(messaging, { 
              vapidKey: vapidKey || undefined 
            });
            
            if (token) {
              // Register token with our backend
              await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  token, 
                  platform: 'web',
                  // We could pass userId if user is logged in
                }),
              });
              console.log('[FCM] Token registered successfully');
            }
          } catch (tokenErr) {
            console.error('[FCM] Error getting token:', tokenErr);
          }
        }
        
        await checkPermissions();
        return result === 'granted';
      }

      if (type === 'location') {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              checkPermissions();
              resolve(true);
            },
            () => {
              checkPermissions();
              resolve(false);
            },
            { timeout: 5000 }
          );
        });
      }

      if (type === 'camera') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          await checkPermissions();
          return true;
        } catch (e) {
          await checkPermissions();
          return false;
        }
      }

      if (type === 'microphone') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          await checkPermissions();
          return true;
        } catch (e) {
          await checkPermissions();
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error(`Error requesting ${type} permission:`, error);
      return false;
    }
  };

  const openPermissionModal = (type: keyof PermissionState) => {
    setActivePermissionRequest(type);
    setIsModalOpen(true);
  };

  const closePermissionModal = () => {
    setIsModalOpen(false);
    setActivePermissionRequest(null);
  };

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        requestPermission,
        checkPermissions,
        isModalOpen,
        activePermissionRequest,
        openPermissionModal,
        closePermissionModal,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

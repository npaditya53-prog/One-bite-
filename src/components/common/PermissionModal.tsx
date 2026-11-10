import React from 'react';
import { 
  Bell, 
  MapPin, 
  Camera, 
  Mic, 
  Image as ImageIcon, 
  X, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { usePermissions } from '../../context/PermissionContext.tsx';

const PERMISSION_DETAILS = {
  notifications: {
    title: 'Stay Updated',
    description: 'Get real-time updates on your order status, exclusive offers, and mouth-watering new arrivals.',
    icon: Bell,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  location: {
    title: 'Precise Delivery',
    description: 'Help us find your exact location for faster and more accurate delivery of your favorite food.',
    icon: MapPin,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  camera: {
    title: 'Quick QR Scan',
    description: 'Scan table QR codes or promotional vouchers directly from your camera for instant ordering.',
    icon: Camera,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  microphone: {
    title: 'Voice Search',
    description: 'Speak to find what you crave. Use your voice to search through our delicious menu items.',
    icon: Mic,
    iconColor: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
  },
  photos: {
    title: 'Share Memories',
    description: 'Upload photos for reviews or customize your profile with your favorite food moments.',
    icon: ImageIcon,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
};

export const PermissionModal: React.FC = () => {
  const { isModalOpen, activePermissionRequest, requestPermission, closePermissionModal } = usePermissions();

  if (!isModalOpen || !activePermissionRequest) return null;

  const details = PERMISSION_DETAILS[activePermissionRequest];
  const Icon = details.icon;

  const handleAllow = async () => {
    await requestPermission(activePermissionRequest);
    closePermissionModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={closePermissionModal}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
        {/* Header Image/Pattern */}
        <div className="h-24 bg-gradient-to-br from-amber-600/20 to-stone-900 relative flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent" />
          </div>
          <div className={`w-16 h-16 ${details.bgColor} rounded-2xl flex items-center justify-center relative z-10 shadow-lg`}>
            <Icon className={`w-8 h-8 ${details.iconColor}`} />
          </div>
          <button 
            onClick={closePermissionModal}
            className="absolute top-4 right-4 p-2 rounded-full bg-stone-800/50 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3 h-3" />
            <span>Secure Access</span>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2 leading-tight">
            {details.title}
          </h3>
          
          <p className="text-stone-400 text-sm leading-relaxed mb-8 px-2">
            {details.description}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleAllow}
              className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 group shadow-lg shadow-amber-900/20"
            >
              <span>Grant Permission</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            
            <button
              onClick={closePermissionModal}
              className="w-full py-3 bg-transparent text-stone-500 hover:text-stone-300 text-sm font-medium transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-stone-950/50 border-t border-stone-800/50">
          <p className="text-[10px] text-stone-500 text-center leading-tight">
            You can always change your preferences in the settings later.
          </p>
        </div>
      </div>
    </div>
  );
};

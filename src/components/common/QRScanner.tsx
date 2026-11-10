import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { usePermissions } from '../../context/PermissionContext.tsx';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, isOpen }) => {
  const { openPermissionModal } = usePermissions();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      setIsInitializing(true);
      setError(null);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsInitializing(false);
        }
      } catch (err: any) {
        console.error('QR Scanner error:', err);
        setError('Unable to access camera. Please check your permissions.');
        setIsInitializing(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-950/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Scanner Container */}
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">QR Code Scanner</h3>
              <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider">Scan table or offer codes</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[300px]">
          {isInitializing ? (
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs text-stone-400 font-medium">Initializing camera...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="text-sm text-rose-400 font-medium">{error}</p>
              <button
                onClick={() => openPermissionModal('camera')}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-900/20"
              >
                Enable Camera
              </button>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              
              {/* Scanner Frame Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative w-64 h-64 border-2 border-amber-500/50 rounded-3xl">
                  {/* Corner Accents */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-500 rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-500 rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-500 rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-500 rounded-br-xl" />
                  
                  {/* Scanning Line Animation */}
                  <div className="absolute left-4 right-4 h-0.5 bg-amber-400/80 shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-[scan_2s_linear_infinite]" />
                </div>
                <p className="mt-8 text-xs text-stone-300 font-bold bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  Align QR code within the frame
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-6 bg-stone-900 border-t border-stone-800 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/10">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[11px] text-stone-400 leading-snug">
              Scanning a Table QR will automatically set your table number for faster dine-in service.
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
      `}} />
    </div>
  );
};

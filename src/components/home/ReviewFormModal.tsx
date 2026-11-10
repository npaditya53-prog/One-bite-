import React, { useState, useRef } from 'react';
import { Star, Camera, X, ShieldCheck, Sparkles, Image as ImageIcon } from 'lucide-react';
import { usePermissions } from '../../context/PermissionContext.tsx';
import { useToast } from '../common/Toast.tsx';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: any) => void;
}

export const ReviewFormModal: React.FC<ReviewFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { openPermissionModal } = usePermissions();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !reviewText.trim()) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    onSubmit({
      customerName,
      reviewText,
      rating,
      image: imagePreview,
      reviewDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    });
    showToast('Thank you for your feedback!', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-stone-950/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
        <div className="h-2 bg-gradient-to-r from-amber-500 to-amber-700" />
        
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">Share Your Experience</h3>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">One Bite Motihari</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Rating */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 px-1">Your Rating</label>
            <div className="flex items-center gap-2 px-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform active:scale-90"
                >
                  <Star className={`w-8 h-8 ${star <= rating ? 'fill-amber-500 text-amber-500' : 'text-stone-200'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 px-1">Your Name</label>
            <input 
              type="text"
              required
              placeholder="e.g. John Doe"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
            />
          </div>

          {/* Review */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 px-1">Your Thoughts</label>
            <textarea 
              required
              placeholder="Tell us what you loved about our food..."
              rows={3}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all resize-none"
            />
          </div>

          {/* Photo Picker */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-stone-500 px-1">Add a Photo</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={async () => {
                  await openPermissionModal('photos');
                  fileInputRef.current?.click();
                }}
                className="w-20 h-20 rounded-2xl bg-stone-50 border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-1.5 text-stone-400 hover:text-amber-600 hover:border-amber-600 transition-all group overflow-hidden relative"
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-bold">Upload</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  accept="image/*"
                />
              </button>
              
              {!imagePreview && (
                <div className="text-[11px] text-stone-400 leading-tight">
                  <p className="font-bold text-stone-600">Snap a photo!</p>
                  <p>Share your food with others.</p>
                </div>
              )}
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="text-[10px] font-bold text-rose-600 hover:text-rose-700"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-lg shadow-amber-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            <span>Submit Review</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </form>

        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Secure Verified Feedback</span>
        </div>
      </div>
    </div>
  );
};

import { ArrowRight } from 'lucide-react';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Users, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Smartphone,
  Globe,
  Plus
} from 'lucide-react';
import { useToast } from '../common/Toast.tsx';

interface SubscriberStats {
  total: number;
  web: number;
  android: number;
}

export function AdminNotifications() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<SubscriberStats>({ total: 0, web: 0, android: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [clickUrl, setClickUrl] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/notifications/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch notification stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast('Title and Message are required.', 'error');
      return;
    }

    if (stats.total === 0) {
      showToast('No active subscribers to broadcast to.', 'error');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, imageUrl, clickUrl }),
      });

      if (res.ok) {
        showToast('Broadcast sent successfully!', 'success');
        setTitle('');
        setBody('');
        setImageUrl('');
        setClickUrl('');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to send broadcast', 'error');
      }
    } catch (err) {
      showToast('Error sending broadcast', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900">Push Notifications</h2>
          <p className="text-sm text-stone-500">Manage device subscriptions and send promotional broadcasts.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-xs font-bold text-emerald-700">FCM Live System</span>
           </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Total Subscribers</p>
            <p className="text-2xl font-black text-stone-900">{isLoading ? '...' : stats.total}</p>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Web Browser</p>
            <p className="text-2xl font-black text-stone-900">{isLoading ? '...' : stats.web}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Android App</p>
            <p className="text-2xl font-black text-stone-900">{isLoading ? '...' : stats.android}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast Form */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
            <Send className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Send Promotional Broadcast</h3>
          </div>
          
          <form onSubmit={handleSendBroadcast} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Notification Title *</label>
              <input 
                type="text"
                required
                placeholder="e.g. 20% OFF Today!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Message Body *</label>
              <textarea 
                required
                rows={3}
                placeholder="Describe your special offer or announcement..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Image URL (Optional)</label>
                <input 
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Target Page URL (Optional)</label>
                <input 
                  type="text"
                  placeholder="/menu or https://..."
                  value={clickUrl}
                  onChange={(e) => setClickUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                This will send a push notification to <span className="font-bold text-amber-900">{stats.total} subscribed devices</span>. Use wisely to avoid annoying customers.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSending || stats.total === 0}
              className="w-full py-4 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 text-white font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending to {stats.total} devices...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Send Broadcast Now</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info & Tips */}
        <div className="space-y-6">
          <div className="bg-stone-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Info className="w-5 h-5" />
                <h4 className="text-sm font-black uppercase tracking-wider">How it works</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-amber-500/20 text-amber-500 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    <span className="text-white font-bold">Automatic Order Updates:</span> Customers receive notifications when their order is confirmed, prepared, and out for delivery.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-amber-500/20 text-amber-500 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    <span className="text-white font-bold">Retention:</span> Sending 1-2 weekly offers can increase repeat orders by up to 30%.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-amber-500/20 text-amber-500 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    <span className="text-white font-bold">Images Matter:</span> Including a mouth-watering food image URL increases click-through rates.
                  </p>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4">
            <h4 className="text-xs font-black text-stone-500 uppercase tracking-widest">Notification Preview</h4>
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center shrink-0 shadow-md">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-stone-900 truncate">{title || 'Your Title Here'}</p>
                  <span className="text-[9px] text-stone-400">now</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-2">
                  {body || 'Your message content will appear here when you type in the form...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

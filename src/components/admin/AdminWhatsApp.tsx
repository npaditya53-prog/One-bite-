import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Phone,
  Webhook
} from 'lucide-react';
import { useToast } from '../common/Toast.tsx';

interface WhatsAppStatus {
  configured: boolean;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  webhookVerified: boolean;
}

export function AdminWhatsApp() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsSending] = useState(false);
  const [testPhone, setTestPhone] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      showToast('Test phone number is required.', 'error');
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/admin/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone }),
      });

      if (res.ok) {
        showToast('Test message (hello_world) sent successfully!', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to send test message', 'error');
      }
    } catch (err) {
      showToast('Error sending test message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading && !status) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900">WhatsApp Business API</h2>
          <p className="text-sm text-stone-500">Official Meta integration for automated order notifications.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchStatus}
             className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors"
             title="Refresh Status"
           >
             <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
           </button>
           <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${status?.configured ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
             <div className={`w-2 h-2 rounded-full animate-pulse ${status?.configured ? 'bg-emerald-500' : 'bg-rose-500'}`} />
             <span className="text-xs font-bold">{status?.configured ? 'API Connected' : 'Not Configured'}</span>
           </div>
        </div>
      </div>

      {/* Setup Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Phone Number ID</p>
            <Settings className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <p className="text-sm font-mono font-bold text-stone-900">{status?.phoneNumberId || 'None'}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Business Account ID</p>
            <Settings className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <p className="text-sm font-mono font-bold text-stone-900">{status?.businessAccountId || 'None'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Webhook Endpoint</p>
            <Webhook className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <p className="text-[10px] font-mono font-bold text-amber-700 truncate" title="https://.../api/webhooks/whatsapp">/api/webhooks/whatsapp</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Webhook Status</p>
            <div className={`w-2 h-2 rounded-full ${status?.webhookVerified ? 'bg-emerald-500' : 'bg-stone-300'}`} />
          </div>
          <p className="text-sm font-bold text-stone-900">{status?.webhookVerified ? 'Active' : 'Pending'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Message Form */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">Test WhatsApp API</h3>
          </div>
          
          <form onSubmit={handleSendTest} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Recipient Phone Number (with Country Code) *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="tel"
                  required
                  placeholder="e.g. 919876543210"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Template: hello_world</p>
                <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
                  This will send the standard Meta test message. Use it to verify that your Access Token and Phone Number ID are correctly configured.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isTesting || !status?.configured}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 group"
            >
              {isTesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending Test...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  <span>Send Test Message</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Integration Status & Tips */}
        <div className="space-y-6">
          <div className="bg-stone-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <MessageSquare className="w-5 h-5" />
                <h4 className="text-sm font-black uppercase tracking-wider">Automation Workflow</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    <span className="text-white font-bold">Opt-in Required:</span> Only customers who check the "Get updates on WhatsApp" box at checkout will receive automated messages.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    <span className="text-white font-bold">Order Tracking:</span> Confirmation and status updates include a direct link to the customer's "My Orders" page.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-500 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    <span className="text-white font-bold">Template Approval:</span> Ensure the <code className="bg-stone-800 px-1 rounded">order_status_update</code> template is approved in your Meta App Dashboard.
                  </p>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 text-xs">
            <h4 className="text-xs font-black text-stone-500 uppercase tracking-widest">Required Templates</h4>
            <div className="space-y-3">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
                <p className="font-bold text-stone-900">Name: <span className="font-mono text-emerald-600">order_status_update</span></p>
                <p className="text-stone-500 italic">"Hi {"{{1}}"}, your One Bite order {"{{2}}"} is now {"{{3}}"}. Track here: {"{{4}}"}"</p>
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-800 font-medium">
                Meta requires all business-initiated messages to use pre-approved templates. If templates aren't approved, messages will fail to send.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

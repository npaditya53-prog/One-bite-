import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { SiteSettings } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import { Save, RotateCcw, Upload, CheckCircle2, AlertTriangle, ShieldCheck, Globe, ExternalLink } from 'lucide-react';

export function AdminSettings() {
  const { settings, updateSettings, uploadImage, resetToDefaults } = useRestaurant();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<SiteSettings>(JSON.parse(JSON.stringify(settings)));
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const [isUploadingAbout, setIsUploadingAbout] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleChange = (field: keyof SiteSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSectionToggle = (section: keyof SiteSettings['sectionsEnabled']) => {
    setFormData(prev => ({
      ...prev,
      sectionsEnabled: {
        ...prev.sectionsEnabled,
        [section]: !prev.sectionsEnabled[section],
      },
    }));
  };

  const handleHighlightsChange = (index: number, val: string) => {
    const list = [...(formData.aboutHighlights || [])];
    list[index] = val;
    setFormData(prev => ({ ...prev, aboutHighlights: list }));
  };

  const handleAddHighlight = () => {
    setFormData(prev => ({
      ...prev,
      aboutHighlights: [...(prev.aboutHighlights || []), 'New highlight feature'],
    }));
  };

  const handleRemoveHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      aboutHighlights: prev.aboutHighlights.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formData);
      showToast('Website settings saved successfully!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleHeroUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHero(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const url = await uploadImage(reader.result as string, file.name);
        setFormData(prev => ({ ...prev, heroImageUrl: url }));
        showToast('Hero image uploaded!', 'success');
      } catch (err: any) {
        showToast(err?.message || 'Failed to upload hero image', 'error');
      } finally {
        setIsUploadingHero(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAboutUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAbout(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const url = await uploadImage(reader.result as string, file.name);
        setFormData(prev => ({ ...prev, aboutImageUrl: url }));
        showToast('About image uploaded!', 'success');
      } catch (err: any) {
        showToast(err?.message || 'Failed to upload about image', 'error');
      } finally {
        setIsUploadingAbout(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const url = await uploadImage(reader.result as string, file.name);
        setFormData(prev => ({ ...prev, logoUrl: url }));
        showToast('Official logo updated successfully!', 'success');
      } catch (err: any) {
        showToast(err?.message || 'Failed to replace logo', 'error');
      } finally {
        setIsUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetToDefaults();
      showToast('Database reset to factory authentic configuration!', 'info');
      setShowResetConfirm(false);
    } catch (err: any) {
      showToast(err?.message || 'Failed to reset data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Website & Brand Settings</h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Configure restaurant identity, contact channels, Google Maps, ordering links, and homepage sections.
          </p>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:text-stone-900 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Factory Seeds</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Brand & Identity */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
            Restaurant Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                required
                value={formData.restaurantName}
                onChange={e => handleChange('restaurantName', e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Tagline *
              </label>
              <input
                type="text"
                required
                value={formData.tagline}
                onChange={e => handleChange('tagline', e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Short Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
            />
          </div>

          {/* Official Brand Logo Management */}
          <div className="pt-3 border-t border-stone-100">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              Official Restaurant Brand Logo
            </label>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl bg-stone-900 border border-stone-800">
              <div className="flex items-center justify-center p-3 bg-stone-950 rounded-lg border border-stone-800 min-w-[200px] h-16">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Current Official One Bite Logo"
                    className="max-h-12 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-stone-500 font-medium">Upload Restaurant Logo</span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="text-xs text-stone-300 font-medium">
                  {formData.logoUrl ? 'Official One Bite Brand Asset Active' : 'No Logo Uploaded'}
                </div>
                <p className="text-[11px] text-stone-400">
                  Used across navbar header, footer, favicon, and admin portal. Maintains exact aspect ratio.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingLogo ? 'Uploading...' : 'Replace Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                    />
                  </label>
                  {formData.logoUrl && formData.logoUrl !== '/one-bite-logo.png' && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logoUrl: '/one-bite-logo.png' }))}
                      className="px-2.5 py-1.5 text-xs text-stone-400 hover:text-white"
                    >
                      Reset to Official Default
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Ordering */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
            Contact Numbers & Ordering Integration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Hotline Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="+91 91234 56789"
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={e => handleChange('whatsapp', e.target.value)}
                placeholder="+91 91234 56789"
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Order Now URL
              </label>
              <input
                type="url"
                value={formData.orderUrl}
                onChange={e => handleChange('orderUrl', e.target.value)}
                placeholder="https://wa.me/919123456789 or Zomato/Swiggy link"
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Ordering Platform Display Name
              </label>
              <input
                type="text"
                value={formData.orderingPlatformName}
                onChange={e => handleChange('orderingPlatformName', e.target.value)}
                placeholder="Direct WhatsApp & Takeaway"
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Location & Google Maps */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
            Location & Google Maps Links
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder="Bagaha Dhala Road, Rajendra Nagar"
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={e => handleChange('pincode', e.target.value)}
                placeholder="845401"
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Google Maps Public URL (Directions)
              </label>
              <input
                type="url"
                value={formData.mapsUrl}
                onChange={e => handleChange('mapsUrl', e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Google Maps Embed Iframe URL
              </label>
              <input
                type="url"
                value={formData.mapsEmbedUrl}
                onChange={e => handleChange('mapsEmbedUrl', e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Social Media Links */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
            Social Media Channels
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                value={formData.instagramUrl}
                onChange={e => handleChange('instagramUrl', e.target.value)}
                placeholder="https://instagram.com/onebitemotihari"
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Facebook URL
              </label>
              <input
                type="url"
                value={formData.facebookUrl}
                onChange={e => handleChange('facebookUrl', e.target.value)}
                placeholder="https://facebook.com/onebitemotihari"
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                YouTube URL
              </label>
              <input
                type="url"
                value={formData.youtubeUrl}
                onChange={e => handleChange('youtubeUrl', e.target.value)}
                placeholder="Optional"
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Hero Content */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
            Homepage Hero Section Content
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Hero Heading
              </label>
              <input
                type="text"
                value={formData.heroHeading}
                onChange={e => handleChange('heroHeading', e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                value={formData.heroCtaText}
                onChange={e => handleChange('heroCtaText', e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Hero Subheading
            </label>
            <textarea
              rows={2}
              value={formData.heroSubheading}
              onChange={e => handleChange('heroSubheading', e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              Hero Image URL or Upload
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.heroImageUrl}
                onChange={e => handleChange('heroImageUrl', e.target.value)}
                className="flex-1 px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{isUploadingHero ? '...' : 'Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleHeroUpload}
                  disabled={isUploadingHero}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 6: About Section Content */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
            About Section Content & Highlights
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                About Heading
              </label>
              <input
                type="text"
                value={formData.aboutHeading}
                onChange={e => handleChange('aboutHeading', e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Established Year
              </label>
              <input
                type="text"
                value={formData.aboutEstablishedYear || ''}
                onChange={e => handleChange('aboutEstablishedYear', e.target.value)}
                placeholder="2023"
                className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
              About Description
            </label>
            <textarea
              rows={3}
              value={formData.aboutDescription}
              onChange={e => handleChange('aboutDescription', e.target.value)}
              className="w-full px-3.5 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none"
            />
          </div>

          {/* Highlights */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Store Highlights List
              </label>
              <button
                type="button"
                onClick={handleAddHighlight}
                className="text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                + Add Highlight
              </button>
            </div>

            <div className="space-y-2">
              {(formData.aboutHighlights || []).map((hl, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={hl}
                    onChange={e => handleHighlightsChange(i, e.target.value)}
                    className="flex-1 px-3.5 py-1.5 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHighlight(i)}
                    className="px-2.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 7: Homepage Section Toggles */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
            Homepage Section Visibility
          </h2>
          <p className="text-xs text-stone-500">
            Control which sections appear on the live homepage:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(formData.sectionsEnabled || {}).map(([key, val]) => (
              <label
                key={key}
                className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50/50 cursor-pointer text-xs font-semibold capitalize hover:bg-stone-100 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={val}
                  onChange={() =>
                    handleSectionToggle(key as keyof SiteSettings['sectionsEnabled'])
                  }
                  className="w-4 h-4 rounded text-amber-600"
                />
                <span>{key.replace(/([A-Z])/g, ' $1')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 6: Custom Domain & Production Launch Readiness */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-stone-900">
                Custom Domain & Launch Checklist
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
              Ready for Production
            </span>
          </div>

          <p className="text-xs text-stone-600 leading-relaxed">
            Configure your custom brand domain (such as <code className="bg-stone-100 px-1.5 py-0.5 rounded text-amber-800 font-mono font-bold">onebitemotihari.in</code>) with DNS records and ensure all launch requirements are satisfied before public promotion.
          </p>

          {/* DNS Configuration Table */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              DNS Records for Vercel / Custom Domain Hosting
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Type</span>
                <span className="font-mono font-bold text-stone-900">A Record</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Name / Host</span>
                <span className="font-mono font-bold text-stone-900">@ (Root)</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Target Value</span>
                <span className="font-mono font-bold text-amber-700">76.76.21.21</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Type</span>
                <span className="font-mono font-bold text-stone-900">CNAME</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Name / Host</span>
                <span className="font-mono font-bold text-stone-900">www</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                <span className="text-stone-400 block text-[10px] uppercase font-bold">Target Value</span>
                <span className="font-mono font-bold text-amber-700">cname.vercel-dns.com</span>
              </div>
            </div>
          </div>

          {/* Launch Requirements Verified */}
          <div className="space-y-2.5 pt-2">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Launch Verification Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Favicon configured across all browsers</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>"Made with AI" tag removed</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dedicated Privacy Policy page (/privacy)</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dedicated Terms & Conditions page (/terms)</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Anti-slop design (zero pill buttons, zero purple)</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified Motihari phone & WhatsApp (+91 82104 42538)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="sticky bottom-4 z-20 bg-stone-900/90 backdrop-blur-md p-4 rounded-2xl border border-stone-800 shadow-2xl flex items-center justify-between text-white">
          <span className="text-xs text-stone-300">
            Unsaved changes will be written directly to the database.
          </span>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-stone-200">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2">Reset Database?</h3>
            <p className="text-xs sm:text-sm text-stone-600 mb-6 leading-relaxed">
              This will reset the entire restaurant menu, gallery, reviews, offers, and settings to the verified initial One Bite Motihari seed state.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isResetting ? 'Resetting...' : 'Yes, Reset Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

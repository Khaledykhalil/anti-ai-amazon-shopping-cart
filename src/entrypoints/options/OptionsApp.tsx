import React, { useEffect, useState } from 'react';
import { UserPreferences } from '../../engine/types';
import {
  DEFAULT_PREFERENCES,
  getPreferences,
  savePreferences
} from '../../utils/storage';
import {
  Shield,
  Sliders,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  Lock,
  ExternalLink
} from 'lucide-react';

export default function OptionsApp() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [newBlockedBrand, setNewBlockedBrand] = useState('');
  const [newAllowedBrand, setNewAllowedBrand] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    getPreferences().then(setPrefs);
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateAndSave = async (updated: UserPreferences, msg?: string) => {
    setPrefs(updated);
    await savePreferences(updated);
    if (msg) triggerToast(msg);
  };

  const handleBlurIntensityChange = (val: number) => {
    updateAndSave({ ...prefs, blurIntensity: val });
  };

  const handleAddBlockedBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBlockedBrand.trim();
    if (!clean) return;
    if (prefs.customBlockedBrands.includes(clean)) return;

    const updated = {
      ...prefs,
      customBlockedBrands: [...prefs.customBlockedBrands, clean],
      customAllowedBrands: prefs.customAllowedBrands.filter((b) => b.toLowerCase() !== clean.toLowerCase())
    };
    updateAndSave(updated, `Added "${clean}" to Custom Blocklist`);
    setNewBlockedBrand('');
  };

  const handleRemoveBlockedBrand = (brand: string) => {
    const updated = {
      ...prefs,
      customBlockedBrands: prefs.customBlockedBrands.filter((b) => b !== brand)
    };
    updateAndSave(updated, `Removed "${brand}" from Blocklist`);
  };

  const handleAddAllowedBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newAllowedBrand.trim();
    if (!clean) return;
    if (prefs.customAllowedBrands.includes(clean)) return;

    const updated = {
      ...prefs,
      customAllowedBrands: [...prefs.customAllowedBrands, clean],
      customBlockedBrands: prefs.customBlockedBrands.filter((b) => b.toLowerCase() !== clean.toLowerCase())
    };
    updateAndSave(updated, `Added "${clean}" to Whitelist`);
    setNewAllowedBrand('');
  };

  const handleRemoveAllowedBrand = (brand: string) => {
    const updated = {
      ...prefs,
      customAllowedBrands: prefs.customAllowedBrands.filter((b) => b !== brand)
    };
    updateAndSave(updated, `Removed "${brand}" from Whitelist`);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(prefs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `blurify-settings-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('Preferences exported successfully');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === 'object' && parsed !== null) {
          const merged: UserPreferences = {
            ...DEFAULT_PREFERENCES,
            ...parsed,
            filters: {
              ...DEFAULT_PREFERENCES.filters,
              ...(parsed.filters || {})
            }
          };
          await updateAndSave(merged, 'Settings imported successfully');
        }
      } catch (err) {
        alert('Invalid JSON file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset all Blurify settings and custom lists to default values?')) {
      await updateAndSave(DEFAULT_PREFERENCES, 'Reset to factory defaults');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-10 px-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg animate-bounce z-50">
          <CheckCircle className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Blurify Settings & Options
              </h1>
              <p className="text-xs text-slate-400">
                Configure optical blur intensity, custom brand lists, and backup filters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 hover:bg-slate-800 text-xs text-slate-300 font-medium transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <label className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-750 hover:bg-slate-800 text-xs text-slate-300 font-medium transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </header>

        {/* Blur Intensity Card */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Optical Blur Intensity</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust the Gaussian blur strength applied over filtered products
              </p>
            </div>
            <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              {prefs.blurIntensity}px
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400">4px (Subtle)</span>
            <input
              type="range"
              min="4"
              max="24"
              value={prefs.blurIntensity}
              onChange={(e) => handleBlurIntensityChange(parseInt(e.target.value, 10))}
              className="flex-1 accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <span className="text-xs text-slate-400">24px (Heavy)</span>
          </div>

          {/* Live Preview Box */}
          <div className="pt-2">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block mb-2">
              Live Preview
            </span>
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
              <div
                style={{ filter: `blur(${prefs.blurIntensity}px)` }}
                className="flex items-center gap-3 transition-all duration-150"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold">
                  PROD
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Sample Deceptive Product</div>
                  <div className="text-xs text-slate-400">$49.99 • Ships from Dropship Inc</div>
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-750 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 flex items-center gap-1.5 shadow-sm">
                <span>🛡️ Filtered: Sample Reason</span>
              </div>
            </div>
          </div>
        </section>

        {/* Custom Whitelist Manager */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Always-Allowed Brands (Whitelist)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Brands and sellers listed here will NEVER be blurred, regardless of active filters
            </p>
          </div>

          <form onSubmit={handleAddAllowedBrand} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter brand name to whitelist (e.g. Patagonia, Apple)..."
              value={newAllowedBrand}
              onChange={(e) => setNewAllowedBrand(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {prefs.customAllowedBrands.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No brands whitelisted yet.</span>
            ) : (
              prefs.customAllowedBrands.map((brand) => (
                <span
                  key={brand}
                  className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                >
                  {brand}
                  <button
                    type="button"
                    onClick={() => handleRemoveAllowedBrand(brand)}
                    className="hover:text-emerald-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </section>

        {/* Custom Blocklist Manager */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Custom Blocked Brands & Sellers</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Immediately blur any product matching these specific brand names
            </p>
          </div>

          <form onSubmit={handleAddBlockedBrand} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter brand or merchant name to block..."
              value={newBlockedBrand}
              onChange={(e) => setNewBlockedBrand(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
            />
            <button
              type="submit"
              className="bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Block
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {prefs.customBlockedBrands.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No custom brands blocked yet.</span>
            ) : (
              prefs.customBlockedBrands.map((brand) => (
                <span
                  key={brand}
                  className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                >
                  {brand}
                  <button
                    type="button"
                    onClick={() => handleRemoveBlockedBrand(brand)}
                    className="hover:text-rose-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </section>

        {/* Privacy Guarantee & Reset */}
        <section className="p-6 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs text-slate-400">
              <span className="text-white font-semibold">100% On-Device Privacy Guaranteed:</span> All
              detection, entropy scoring, and filtering runs entirely inside your browser. Zero tracking.
            </div>
          </div>

          <button
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </section>

        <footer className="text-center text-xs text-slate-500 pb-8">
          Blurify is an open-source public good under MIT License. Check the{' '}
          <a
            href="https://github.com/Khaledykhalil/anti-ai-amazon-shopping-cart"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
          >
            GitHub Repository <ExternalLink className="w-3 h-3" />
          </a>
        </footer>
      </div>
    </div>
  );
}

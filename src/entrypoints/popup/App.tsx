import React, { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import {
  FilterAction,
  FilterCategoryId,
  TabStats,
  UserPreferences
} from '../../engine/types';
import { FILTER_METADATA } from '../../filters/registry';
import {
  DEFAULT_PREFERENCES,
  FILTER_CATEGORIES,
  getPreferences,
  getTabStats,
  savePreferences
} from '../../utils/storage';
import {
  Shield,
  ShieldAlert,
  Settings,
  Search,
  ExternalLink,
  Globe,
  Sliders
} from 'lucide-react';

export default function App() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [stats, setStats] = useState<TabStats | null>(null);
  const [hasAllUrls, setHasAllUrls] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      const p = await getPreferences();
      const s = await getTabStats();
      setPrefs(p);
      setStats(s);

      try {
        if (typeof browser !== 'undefined' && browser.permissions?.contains) {
          const has = await browser.permissions.contains({ origins: ['*://*/*'] });
          setHasAllUrls(has);
        }
      } catch {
        // Fallback
      }

      setLoading(false);
    }
    loadData();
  }, []);

  const handleMasterToggle = async () => {
    const updated = { ...prefs, masterEnabled: !prefs.masterEnabled };
    setPrefs(updated);
    await savePreferences(updated);
  };

  const handleCategoryToggle = async (catId: FilterCategoryId) => {
    const current = prefs.filters[catId] || { enabled: true, action: 'blur' };
    const updated = {
      ...prefs,
      filters: {
        ...prefs.filters,
        [catId]: {
          ...current,
          enabled: !current.enabled
        }
      }
    };
    setPrefs(updated);
    await savePreferences(updated);
  };

  const handleActionChange = async (catId: FilterCategoryId, action: FilterAction) => {
    const current = prefs.filters[catId] || { enabled: true, action: 'blur' };
    const updated = {
      ...prefs,
      filters: {
        ...prefs.filters,
        [catId]: {
          ...current,
          action
        }
      }
    };
    setPrefs(updated);
    await savePreferences(updated);
  };

  const requestUniversalPermissions = async () => {
    try {
      if (typeof browser !== 'undefined' && browser.permissions?.request) {
        const granted = await browser.permissions.request({ origins: ['*://*/*'] });
        if (granted) {
          setHasAllUrls(true);
          const updated = { ...prefs, universalStoreMode: true };
          setPrefs(updated);
          await savePreferences(updated);
        }
      }
    } catch (err) {
      console.warn('Blurify: Universal permissions request failed', err);
    }
  };

  const openOptions = () => {
    if (typeof browser !== 'undefined' && browser.runtime?.openOptionsPage) {
      browser.runtime.openOptionsPage();
    }
  };

  const filteredCategories = FILTER_CATEGORIES.filter((catId) => {
    const meta = FILTER_METADATA[catId];
    if (!meta) return false;
    const q = searchQuery.toLowerCase();
    return (
      meta.name.toLowerCase().includes(q) ||
      meta.shortDescription.toLowerCase().includes(q)
    );
  });

  const totalFilteredOnPage = stats?.totalFiltered || 0;
  const activeFiltersCount = Object.values(prefs.filters).filter((f) => f.enabled).length;

  if (loading) {
    return (
      <div className="w-[380px] h-[480px] bg-slate-900 flex items-center justify-center text-slate-400">
        <Shield className="w-8 h-8 animate-pulse text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="w-[390px] max-h-[580px] flex flex-col bg-slate-900 text-slate-100 font-sans select-none">
      {/* Top Header */}
      <header className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm tracking-tight text-white">Blurify</h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${prefs.masterEnabled ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {stats?.url ? `Active on ${stats.url}` : 'Universal E-Commerce Filter'}
            </p>
          </div>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={openOptions}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Options & Blocklist Manager"
          >
            <Settings className="w-4 h-4" />
          </button>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.masterEnabled}
              onChange={handleMasterToggle}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </header>

      {/* Page Stats Bar */}
      <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span className="font-medium text-slate-300">
            {totalFilteredOnPage > 0
              ? `${totalFilteredOnPage} items blurred on this page`
              : 'Page clean / zero slop detected'}
          </span>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">
          {activeFiltersCount}/10 active
        </span>
      </div>

      {/* Universal Store Mode Banner */}
      {!hasAllUrls && (
        <div className="m-3 p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-2.5">
          <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-semibold text-emerald-200">
              Enable Universal Store Mode
            </h4>
            <p className="text-[11px] text-emerald-400/80 leading-relaxed mt-0.5">
              Allow Blurify to filter Shopify, WooCommerce, and independent creator storefronts.
            </p>
            <button
              onClick={requestUniversalPermissions}
              className="mt-2 text-xs font-medium bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-md transition inline-flex items-center gap-1 shadow-sm"
            >
              Enable on All Stores <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search filters (e.g. boycott, AI, dropship)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Filter Categories List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {filteredCategories.map((catId) => {
          const meta = FILTER_METADATA[catId];
          const config = prefs.filters[catId] || { enabled: true, action: 'blur' };
          const countOnTab = stats?.byCategory?.[catId] || 0;

          return (
            <div
              key={catId}
              className={`p-2.5 rounded-xl border transition-all ${
                config.enabled
                  ? 'bg-slate-800/40 border-slate-750 hover:border-slate-600'
                  : 'bg-slate-900/60 border-slate-800/80 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg leading-none mt-0.5">{meta.icon}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-xs text-white">
                        {meta.name}
                      </h3>
                      {countOnTab > 0 && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded-full font-mono font-bold">
                          {countOnTab}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
                      {meta.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Category Toggle */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={() => handleCategoryToggle(catId)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Action Mode Pills (Blur | Dim | Hide) */}
              {config.enabled && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Action:</span>
                  <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                    {(['blur', 'dim', 'hide'] as FilterAction[]).map((action) => (
                      <button
                        key={action}
                        onClick={() => handleActionChange(catId, action)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-medium capitalize transition ${
                          config.action === action
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <a
          href="https://github.com/Khaledykhalil/anti-ai-amazon-shopping-cart"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-400 flex items-center gap-1 transition"
        >
          <span>Open Source</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <button
          onClick={openOptions}
          className="hover:text-white flex items-center gap-1 transition"
        >
          <Sliders className="w-3 h-3" />
          <span>More Settings</span>
        </button>
      </footer>
    </div>
  );
}

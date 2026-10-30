import { getSettings, saveSettings, getStats } from '../shared/storage';
import { FilteringMode, SensitivityLevel, UserSettings } from '../shared/types';

document.addEventListener('DOMContentLoaded', async () => {
  const masterToggle = document.getElementById('master-toggle') as HTMLInputElement;
  const modeRadios = document.querySelectorAll<HTMLInputElement>('input[name="filter-mode"]');
  const sensitivitySlider = document.getElementById('sensitivity-slider') as HTMLInputElement;
  const sensitivityBadge = document.getElementById('sensitivity-badge') as HTMLElement;

  const toggleClothing = document.getElementById('toggle-clothing') as HTMLInputElement;
  const toggleFood = document.getElementById('toggle-food') as HTMLInputElement;
  const toggleMarketing = document.getElementById('toggle-marketing') as HTMLInputElement;

  const statFiltered = document.getElementById('stat-filtered') as HTMLElement;
  const statSwapped = document.getElementById('stat-swapped') as HTMLElement;
  const statScanned = document.getElementById('stat-scanned') as HTMLElement;

  const activeTabStatus = document.getElementById('active-tab-status') as HTMLElement;
  const btnRefresh = document.getElementById('btn-refresh') as HTMLButtonElement;

  // Load current settings and stats
  const settings = await getSettings();
  const stats = await getStats();

  // Populate Stats
  if (statFiltered) statFiltered.textContent = String(stats.aiImagesFiltered);
  if (statSwapped) statSwapped.textContent = String(stats.realPhotosSwapped);
  if (statScanned) statScanned.textContent = String(stats.listingsScanned);

  // Populate Settings
  if (masterToggle) masterToggle.checked = settings.enabled;

  modeRadios.forEach((radio) => {
    radio.checked = radio.value === settings.mode;
  });

  const sensitivityMap: Record<SensitivityLevel, string> = {
    low: '1',
    medium: '2',
    high: '3'
  };
  const sensitivityLabels: Record<string, SensitivityLevel> = {
    '1': 'low',
    '2': 'medium',
    '3': 'high'
  };

  if (sensitivitySlider) {
    sensitivitySlider.value = sensitivityMap[settings.sensitivity] || '2';
    updateSensitivityLabel(settings.sensitivity);
  }

  if (toggleClothing) toggleClothing.checked = settings.filterClothingModels;
  if (toggleFood) toggleFood.checked = settings.filterFoodImagery;
  if (toggleMarketing) toggleMarketing.checked = settings.filterMarketingSlop;

  // Check active tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url && tab.url.includes('amazon.')) {
      if (activeTabStatus) {
        activeTabStatus.textContent = '🟢 Active on Amazon';
        activeTabStatus.style.color = '#34d399';
      }
    } else {
      if (activeTabStatus) {
        activeTabStatus.textContent = '⚪ Navigate to Amazon';
      }
    }
  } catch {
    // Ignore
  }

  function updateSensitivityLabel(level: SensitivityLevel) {
    if (!sensitivityBadge) return;
    if (level === 'low') {
      sensitivityBadge.textContent = 'Relaxed';
      sensitivityBadge.style.color = '#60a5fa';
    } else if (level === 'medium') {
      sensitivityBadge.textContent = 'Balanced';
      sensitivityBadge.style.color = '#34d399';
    } else {
      sensitivityBadge.textContent = 'Strict';
      sensitivityBadge.style.color = '#f87171';
    }
  }

  async function notifyTabs(updatedSettings: UserSettings) {
    await saveSettings(updatedSettings);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id && tab.url?.includes('amazon.')) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'SETTINGS_UPDATED',
          payload: updatedSettings
        });
      }
    } catch {
      // Content script may not be loaded yet
    }
  }

  // Event Listeners
  masterToggle?.addEventListener('change', async () => {
    settings.enabled = masterToggle.checked;
    await notifyTabs(settings);
  });

  modeRadios.forEach((radio) => {
    radio.addEventListener('change', async () => {
      if (radio.checked) {
        settings.mode = radio.value as FilteringMode;
        await notifyTabs(settings);
      }
    });
  });

  sensitivitySlider?.addEventListener('input', async () => {
    const level = sensitivityLabels[sensitivitySlider.value] || 'medium';
    settings.sensitivity = level;
    updateSensitivityLabel(level);
    await notifyTabs(settings);
  });

  toggleClothing?.addEventListener('change', async () => {
    settings.filterClothingModels = toggleClothing.checked;
    await notifyTabs(settings);
  });

  toggleFood?.addEventListener('change', async () => {
    settings.filterFoodImagery = toggleFood.checked;
    await notifyTabs(settings);
  });

  toggleMarketing?.addEventListener('change', async () => {
    settings.filterMarketingSlop = toggleMarketing.checked;
    await notifyTabs(settings);
  });

  btnRefresh?.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.tabs.reload(tab.id);
        window.close();
      }
    } catch {
      // Ignore
    }
  });
});

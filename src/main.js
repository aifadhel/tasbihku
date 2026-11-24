import '@fontsource-variable/google-sans-flex';
import '@fontsource/google-sans-code/400.css';
import '@fontsource/google-sans-code/500.css';
import '@fontsource/google-sans-code/700.css';

import { dispatch } from './app/command-bus.js';
import { initDomBridge } from './app/dom-bridge.js';
import { initFeatureRegistry, loadFeature, registerFeature } from './app/feature-registry.js';
import { featureManifest as dzikirCustomManifest } from './features/dzikir-custom/dzikir-custom.contract.js';
import { featureManifest as dzikirGuidedManifest } from './features/dzikir-guided/dzikir-guided.contract.js';
import { featureManifest as habitsCoreManifest } from './features/habits-core/habits-core.contract.js';
import { featureManifest as habitsUiManifest } from './features/habits-ui/habits-ui.contract.js';
import { featureManifest as settingsShellManifest } from './features/settings-shell/settings-shell.contract.js';
import { featureManifest as tasbihCounterManifest } from './features/tasbih-counter/tasbih-counter.contract.js';
import { applyTranslations } from './shared/i18n.js';
import { initAudioUnlock } from './shared/media.js';
import { loadState } from './shared/store.js';
import { initInstallPrompt, initServiceWorker, initWakeLockVisibility } from './shared/system.js';

registerFeature(tasbihCounterManifest);
registerFeature(dzikirGuidedManifest);
registerFeature(dzikirCustomManifest);
registerFeature(habitsCoreManifest);
registerFeature(habitsUiManifest);
registerFeature(settingsShellManifest);
initFeatureRegistry();
initDomBridge();

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    await loadState();

    const staleQuoteCard = document.getElementById('quote-card') || document.querySelector('.quote-toggle-wrapper');
    if (staleQuoteCard) staleQuoteCard.remove();
    if (document.body && document.body.classList.contains('stealth-mode')) {
      document.body.classList.remove('stealth-mode');
    }

    applyTranslations();

    await Promise.all([
      loadFeature('settings-shell'),
      loadFeature('habits-core'),
      loadFeature('tasbih-counter'),
      loadFeature('habits-ui')
    ]);

    dispatch('habits:refresh-cache').catch(() => {});
    dispatch('settings:init-ui').catch(console.error);
    dispatch('habits:init-reminders').catch(() => {});

    initAudioUnlock();
    initWakeLockVisibility();
    initServiceWorker();
    initInstallPrompt();
  });
}

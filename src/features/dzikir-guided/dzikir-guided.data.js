import { getLocalizedText, t } from '../../shared/i18n.js';
import { state } from '../../shared/store.js';
import wiridReadings from './wirid.data.json';
import dzikirPagi from './pagi.data.json';
import dzikirPetang from './petang.data.json';

export { wiridReadings, dzikirPagi, dzikirPetang, getLocalizedText };

export function getSessionData(type, id) {
  let rawPages = [];
  let name = t('player_title_default');

  if (type === 'custom') {
    const item = (state.customList || []).find((i) => i.id == id);
    if (item) {
      name = item.name;
      rawPages = item.pages;
    }
  } else if (type === 'pagi') {
    name = t('dzikir_pagi_title');
    rawPages = state.guidedData.pagi || dzikirPagi;
  } else if (type === 'petang') {
    name = t('dzikir_petang_title');
    rawPages = state.guidedData.petang || dzikirPetang;
  } else if (type === 'wirid') {
    name = t('wirid_title');
    rawPages = state.guidedData.wirid || wiridReadings;
  }

  return { name, pages: rawPages };
}

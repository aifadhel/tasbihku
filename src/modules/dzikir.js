/* ========================================================================= */
/* --- TasbihKu Dzikir Module (src/modules/dzikir.js) --- */
/* ========================================================================= */

import { state, saveState } from '../core/store.js';
import { vibrate, playTapSound } from '../hardware/media.js';
import { trackActivity, checkAndTriggerLinkedHabit, showStackingCelebrationToast } from './habits.js';
import { showModal, showPage, animateValue, triggerCelebration, SVG_ICONS } from '../ui/router.js';
import azkarData from '../data/azkar.json';

// Hardcoded Guided Readings Datasets
export const wiridReadings = [
    { arabic: "أَسْتَغْفِرُ اللَّهَ", latin: "Astaghfirullah.", translation: "Aku memohon ampun kepada Allah.", target: 3, reference: "HR. Muslim no. 591" },
    { arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", latin: "Allahumma antas salam, wa minkas salam, tabarakta ya dzal jalali wal ikram.", translation: "Ya Allah, Engkau adalah Pemberi keselamatan, dan dari-Mu keselamatan, Maha Suci Engkau wahai Pemilik Keagungan dan Kemuliaan.", target: 1, reference: "HR. Muslim no. 591" },
    { arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ...", latin: "Allahu laa ilaaha illaa huwal hayyul qayyum. Laa ta'khudzuhuu sinatuw wa laa naum...", translation: "Allah, tidak ada tuhan yang berhak disembah melainkan Dia Yang Hidup kekal lagi terus menerus mengurus (makhluk-Nya)...", target: 1, reference: "HR. An-Nasa'i no. 100, disahihkan oleh Al-Albani" },
    { arabic: "سُبْحَانَ اللَّهِ", latin: "Subhanallah.", translation: "Maha Suci Allah.", target: 33, reference: "HR. Muslim no. 597" },
    { arabic: "الْحَمْدُ لِلَّهِ", latin: "Alhamdulillah.", translation: "Segala puji bagi Allah.", target: 33, reference: "HR. Muslim no. 597" },
    { arabic: "اللَّهُ أَكْبَرُ", latin: "Allahu Akbar.", translation: "Allah Maha Besar.", target: 33, reference: "HR. Muslim no. 597" },
    { arabic: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", latin: "Laa ilaha illallahu wahdahu laa syarikalah, lahul mulku wa lahul hamdu wa huwa 'ala kulli syai'in qadir.", translation: "Tidak ada tuhan yang berhak disembah kecuali Allah Yang Maha Esa, tidak ada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala pujian, dan Dia Maha Kuasa atas segala sesuatu.", target: 1, reference: "HR. Muslim no. 597 (Penggenap 100)" }
];

export const dzikirPagi = [
    { arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ...", latin: "Allahu laa ilaaha illaa huwal hayyul qayyum. Laa ta'khudzuhuu sinatuw wa laa naum...", translation: "Allah, tidak ada tuhan yang berhak disembah melainkan Dia Yang Hidup kekal lagi terus menerus mengurus (makhluk-Nya)...", target: 1, reference: "HR. Al-Hakim 1/562, disahihkan oleh Al-Albani" },
    { arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", latin: "Ashbahnaa wa ashbahal mulku lillah, wal hamdu lillah, laa ilaha illallahu wahdahu laa syarikalah, lahul mulku wal lahul hamdu wa huwa 'ala kulli syai'in qadir.", translation: "Kami telah memasuki waktu pagi dan kerajaan hanya milik Allah, segala puji bagi Allah. Tidak ada tuhan yang berhak disembah kecuali Allah Yang Maha Esa, tidak ada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala pujian, dan Dia Maha Kuasa atas segala sesuatu.", target: 1, reference: "HR. Muslim no. 2723" },
    { arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ", latin: "Allahumma bika ashbahnaa, wa bika amsainaa, wa bika nahyaa, wa bika namuutu wa ilaikan nusyuur.", translation: "Ya Allah, dengan rahmat-Mu kami memasuki waktu pagi, dan dengan rahmat-Mu kami memasuki waktu sore. Dengan-Mu kami hidup dan dengan-Mu kami mati. Dan kepada-Mu kami dibangkitkan.", target: 1, reference: "HR. At-Tirmidzi no. 3391" },
    { arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوْءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوْءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ", latin: "Allahumma anta rabbii laa ilaha illaa ant, khalaqtanii wa anaa 'abduk, wa anaa 'ala 'ahdika wa wa'dika mastatha'tu. A'uudzu bika min syarri maa shana'tu, abuu-u laka bini'matika 'alay, wa abuu-u bizanbii faghfirlii fa innahu laa yaghfirudz dzunuuba illaa ant.", translation: "Ya Allah, Engkau adalah Tuhanku, tidak ada tuhan yang berhak disembah kecuali Engkau. Engkau yang menciptakan aku dan aku adalah hamba-Mu. Aku di atas ikatan dan janji-Mu semampuku. Aku berlindung kepada-Mu dari kejahatan yang aku perbuat. Aku mengakui nikmat-Mu kepadaku dan aku mengakui dosaku, maka ampunilah aku. Sesungguhnya tidak ada yang dapat mengampuni dosa kecuali Engkau.", target: 1, reference: "HR. Al-Bukhari no. 6306 (Sayyidul Istighfar)" },
    { arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", latin: "Subhanallahi wa bihamdih.", translation: "Maha Suci Allah dan segala puji bagi-Nya.", target: 100, reference: "HR. Muslim no. 2692" },
    { arabic: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", latin: "Laa ilaha illallahu wahdahu laa syarikalah, lahul mulku wa lahul hamdu wa huwa 'ala kulli syai'in qadir.", translation: "Tidak ada tuhan yang berhak disembah kecuali Allah Yang Maha Esa, tidak ada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala pujian, dan Dia Maha Kuasa atas segala sesuatu.", target: 10, reference: "HR. Abu Daud no. 5077" },
    { arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي", latin: "Allahumma innii as-alukal 'aafiyata fid dunyaa wal aakhirah, allahumma innii as-alukal 'afwa wal 'aafiyata fii diinii wa dunyaaya wa ahlii wa maalii.", translation: "Ya Allah, sesungguhnya aku memohon kepada-Mu kesejahteraan di dunia dan akhirat. Ya Allah, sesungguhnya aku memohon ampunan dan kesejahteraan dalam agamaku, duniaku, keluargaku, dan hartaku.", target: 1, reference: "HR. Abu Daud no. 5074, Ibnu Majah no. 3871" },
    { arabic: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ", latin: "Allahumma 'aafinii fii badanii, allahumma 'aafinii fii sam'ii, allahumma 'aafinii fii basharii, laa ilaha illaa ant.", translation: "Ya Allah, sehatkanlah badanku. Ya Allah, sehatkanlah pendengaranku. Ya Allah, sehatkanlah penglihatanku. Tidak ada tuhan yang berhak disembah kecuali Engkau.", target: 3, reference: "HR. Abu Daud no. 5090" },
    { arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ", latin: "Bismillahilladzii laa yadhurru ma'asmihi syai-un fil ardhi wa laa fis samaa-i wa huwas samii'ul 'aliim.", translation: "Dengan nama Allah yang dengan nama-Nya tidak ada sesuatu pun di bumi dan langit yang dapat mendatangkan bahaya, dan Dia Maha Mendengar lagi Maha Mengetahui.", target: 3, reference: "HR. Abu Daud no. 5088, At-Tirmidzi no. 3388" },
    { arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", latin: "Astaghfirullaha wa atuubu ilaih.", translation: "Aku memohon ampunan Allah dan bertaubat kepada-Nya.", target: 100, reference: "HR. Al-Bukhari no. 6307, Muslim no. 2702" }
];

export const dzikirPetang = [
    { arabic: "اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ...", latin: "Allahu laa ilaaha illaa huwal hayyul qayyum. Laa ta'khudzuhuu sinatuw wa laa naum...", translation: "Allah, tidak ada tuhan yang berhak disembah melainkan Dia Yang Hidup kekal lagi terus menerus mengurus (makhluk-Nya)...", target: 1, reference: "HR. Al-Hakim 1/562, disahihkan oleh Al-Albani" },
    { arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", latin: "Amsainaa wa amsal mulku lillah, wal hamdu lillah, laa ilaha illallahu wahdahu laa syarikalah, lahul mulku wal lahul hamdu wa huwa 'ala kulli syai'in qadir.", translation: "Kami telah memasuki waktu sore dan kerajaan hanya milik Allah, segala puji bagi Allah. Tidak ada tuhan yang berhak disembah kecuali Allah Yang Maha Esa, tidak ada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala pujian, dan Dia Maha Kuasa atas segala sesuatu.", target: 1, reference: "HR. Muslim no. 2723" },
    { arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ", latin: "Allahumma bika amsainaa, wa bika ashbahnaa, wa bika nahyaa, wa bika namuutu wa ilaikal mashiir.", translation: "Ya Allah, dengan rahmat-Mu kami memasuki waktu sore, dan dengan rahmat-Mu kami memasuki waktu pagi. Dengan-Mu kami hidup dan dengan-Mu kami mati. Dan kepada-Mu kami kembali.", target: 1, reference: "HR. At-Tirmidzi no. 3391" },
    { arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوْءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوْءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ", latin: "Allahumma anta rabbii laa ilaha illaa ant, khalaqtanii wa anaa 'abduk, wa anaa 'ala 'ahdika wa wa'dika mastatha'tu. A'uudzu bika min syarri maa shana'tu, abuu-u laka bini'matika 'alay, wa abuu-u bizanbii faghfirlii fa innahu laa yaghfirudz dzunuuba illaa ant.", translation: "Ya Allah, Engkau adalah Tuhanku, tidak ada tuhan yang berhak disembah kecuali Engkau. Engkau yang menciptakan aku dan aku adalah hamba-Mu. Aku di atas ikatan dan janji-Mu semampuku. Aku berlindung kepada-Mu dari kejahatan yang aku perbuat. Aku mengakui nikmat-Mu kepadaku dan aku mengakui dosaku, maka ampunilah aku. Sesungguhnya tidak ada yang dapat mengampuni dosa kecuali Engkau.", target: 1, reference: "HR. Al-Bukhari no. 6306 (Sayyidul Istighfar)" },
    { arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", latin: "Subhanallahi wa bihamdih.", translation: "Maha Suci Allah dan segala puji bagi-Nya.", target: 100, reference: "HR. Muslim no. 2692" },
    { arabic: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", latin: "Laa ilaha illallahu wahdahu laa syarikalah, lahul mulku wa lahul hamdu wa huwa 'ala kulli syai'in qadir.", translation: "Tidak ada tuhan yang berhak disembah kecuali Allah Yang Maha Esa, tidak ada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala pujian, dan Dia Maha Kuasa atas segala sesuatu.", target: 10, reference: "HR. Abu Daud no. 5077" },
    { arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي", latin: "Allahumma innii as-alukal 'aafiyata fid dunyaa wal aakhirah, allahumma innii as-alukal 'afwa wal 'aafiyata fii diinii wa dunyaaya wa ahlii wa maalii.", translation: "Ya Allah, sesungguhnya aku memohon kepada-Mu kesejahteraan di dunia dan akhirat. Ya Allah, sesungguhnya aku memohon ampunan dan kesejahteraan dalam agamaku, duniaku, keluargaku, dan hartaku.", target: 1, reference: "HR. Abu Daud no. 5074" },
    { arabic: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ", latin: "Allahumma 'aafinii fii badanii, allahumma 'aafinii fii sam'ii, allahumma 'aafinii fii basharii, laa ilaha illaa ant.", translation: "Ya Allah, sehatkanlah badanku. Ya Allah, sehatkanlah pendengaranku. Ya Allah, sehatkanlah penglihatanku. Tidak ada tuhan yang berhak disembah kecuali Engkau.", target: 3, reference: "HR. Abu Daud no. 5090" },
    { arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", latin: "A'uudzu bikalimaatillahit taammaati min syarri maa khalaq.", translation: "Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan makhluk yang Dia ciptakan.", target: 3, reference: "HR. Muslim no. 2709, At-Tirmidzi no. 3393" },
    { arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", latin: "Astaghfirullaha wa atuubu ilaih.", translation: "Aku memohon ampunan Allah dan bertaubat kepada-Nya.", target: 100, reference: "HR. Al-Bukhari no. 6307, Muslim no. 2702" }
];

// Editor Session state
export let editorSession = null;
export let editorType = null;
export let editorId = null;

let playerAutoSkipTimeout = null;

export function getSessionData(type, id) {
    let rawPages = [];
    let name = "Dzikir";

    if (type === 'custom') {
        const item = state.customList.find(i => i.id == id);
        if (item) {
            name = item.name;
            rawPages = item.pages;
        }
    } else {
        if (type === 'pagi') { name = 'Dzikir Pagi'; rawPages = state.guidedData.pagi || dzikirPagi; }
        else if (type === 'petang') { name = 'Dzikir Petang'; rawPages = state.guidedData.petang || dzikirPetang; }
        else if (type === 'wirid') { name = 'Wirid Ba\'da Shalat'; rawPages = state.guidedData.wirid || wiridReadings; }
    }

    return { name, pages: rawPages };
}

export function startPlayer(type, id = null) {
    trackActivity();
    state.playerType = type;
    state.playerId = id;
    state.playerIndex = 0;
    state.playerCount = 0;
    saveState();

    const d = getSessionData(type, id);
    if (!d.pages || d.pages.length === 0) {
        showModal('Kosong', 'Tidak ada bacaan dzikir.', null, true);
        return;
    }

    updatePlayerUI();
    showPage('page-player');
}

export function updatePlayerUI() {
    const session = getSessionData(state.playerType, state.playerId);
    if (!session || !session.pages || session.pages.length === 0) return;

    const pages = session.pages;
    if (state.playerIndex >= pages.length) state.playerIndex = pages.length - 1;

    const currentPage = pages[state.playerIndex];

    const titleEl = document.getElementById('player-title');
    const infoEl = document.getElementById('player-reading-info');
    const arabicEl = document.getElementById('player-arabic');
    const latinEl = document.getElementById('player-latin');
    const transEl = document.getElementById('player-translation');
    const refEl = document.getElementById('player-reference');
    const counterEl = document.getElementById('player-counter');
    const targetEl = document.getElementById('player-target-display');
    const progressEl = document.getElementById('player-progress');
    const undoBtn = document.getElementById('player-undo-btn');

    if (titleEl) titleEl.innerText = session.name;
    if (infoEl) infoEl.innerText = `${state.playerIndex + 1} / ${pages.length}`;

    if (arabicEl) {
        arabicEl.innerText = currentPage.arabic || '';
        arabicEl.style.display = currentPage.arabic ? 'block' : 'none';
    }
    if (latinEl) {
        latinEl.innerText = currentPage.latin || '';
        latinEl.style.display = currentPage.latin ? 'block' : 'none';
    }
    if (transEl) {
        transEl.innerText = currentPage.translation || '';
        transEl.style.display = currentPage.translation ? 'block' : 'none';
    }
    if (refEl) {
        refEl.innerText = currentPage.reference || '';
        refEl.style.display = currentPage.reference ? 'block' : 'none';
    }

    if (counterEl) counterEl.innerText = state.playerCount;
    if (targetEl) targetEl.innerText = `Target: ${currentPage.target}x`;

    if (progressEl) {
        const progress = (state.playerCount / Math.max(currentPage.target, 1)) * 100;
        progressEl.style.width = Math.min(progress, 100) + '%';
    }

    if (undoBtn) {
        const isDisabled = state.playerIndex === 0 && state.playerCount === 0;
        undoBtn.disabled = isDisabled;
        undoBtn.setAttribute('aria-disabled', isDisabled);
    }
}

export function incrementPlayer() {
    const session = getSessionData(state.playerType, state.playerId);
    if (!session || !session.pages || session.pages.length === 0) return;

    const pages = session.pages;
    const currentPage = pages[state.playerIndex];

    if (state.playerCount < currentPage.target) {
        state.playerCount++;
        saveState();

        playTapSound();
        updatePlayerUI();
        animateValue('player-counter', state.playerCount);

        if (state.playerCount >= currentPage.target) {
            vibrate([50, 100, 50, 100, 100]);
            triggerCelebration();

            // Trigger linked habits for individual page (micro-habit completion)
            if (currentPage.arabic) {
                const libMatch = azkarData.find(a => a.arabic && a.arabic.substring(0, 15) === currentPage.arabic.substring(0, 15));
                if (libMatch) {
                    const completed = checkAndTriggerLinkedHabit(`library-${libMatch.id}`);
                    if (Array.isArray(completed)) {
                        completed.forEach(name => showStackingCelebrationToast(name));
                    }
                }
            }

            if (playerAutoSkipTimeout) clearTimeout(playerAutoSkipTimeout);
            playerAutoSkipTimeout = setTimeout(() => {
                goToNextPlayerPage();
            }, 1000);
        } else if (state.vibrationInterval > 0 && state.playerCount % state.vibrationInterval === 0) {
            vibrate([40, 40]);
        } else {
            vibrate(15);
        }
    }
}

export function playerUndo() {
    vibrate([30, 50, 30]);

    if (state.playerCount > 0) {
        state.playerCount--;
        saveState();
        updatePlayerUI();
        animateValue('player-counter', state.playerCount);
    } else if (state.playerIndex > 0) {
        state.playerIndex--;
        const prevPage = getSessionData(state.playerType, state.playerId).pages[state.playerIndex];
        state.playerCount = Math.max(0, prevPage.target - 1);
        saveState();
        updatePlayerUI();
    }
}

export function goToNextPlayerPage() {
    if (playerAutoSkipTimeout) clearTimeout(playerAutoSkipTimeout);
    const session = getSessionData(state.playerType, state.playerId);
    const pages = session.pages;

    if (state.playerIndex < pages.length - 1) {
        state.playerIndex++;
        state.playerCount = 0;
        saveState();
        updatePlayerUI();
    } else {
        // Trigger guided session or custom list completion (macro-habit completion)
        if (state.playerType === 'pagi' || state.playerType === 'petang' || state.playerType === 'wirid') {
            const completed = checkAndTriggerLinkedHabit(`guided-${state.playerType}`);
            if (Array.isArray(completed)) {
                completed.forEach(name => showStackingCelebrationToast(name));
            }
        } else if (state.playerType === 'custom') {
            const completed = checkAndTriggerLinkedHabit(`custom-${state.playerId}`);
            if (Array.isArray(completed)) {
                completed.forEach(name => showStackingCelebrationToast(name));
            }
        }

        showModal('Alhamdulillah! Selesai', `Anda telah menyelesaikan ${session.name}. Semoga Allah menerima amal kita.`, () => {
            showPage('page-menu');
        });
    }
}

export function confirmResetPlayer() {
    if (state.playerCount === 0 && state.playerIndex === 0) return;
    showModal('Ulangi Dzikir', 'Apakah Anda ingin mengulang dzikir dari awal?', () => {
        state.playerIndex = 0;
        state.playerCount = 0;
        if (playerAutoSkipTimeout) clearTimeout(playerAutoSkipTimeout);
        saveState();
        updatePlayerUI();
    });
}

export function renderCustomList() {
    const container = document.getElementById('custom-list-container');
    if (!container) return;

    container.innerHTML = '';
    if (!state.customList || state.customList.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.cssText = 'padding: 40px; text-align: center; opacity: 0.5;';
        const emptySpan = document.createElement('span');
        emptySpan.className = 'text-sub';
        emptySpan.textContent = 'Belum ada dzikir custom.';
        emptyDiv.appendChild(emptySpan);
        container.appendChild(emptyDiv);
        return;
    }

    state.customList.forEach((item, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'dzikir-row';

        const btnMain = document.createElement('button');
        btnMain.className = 'btn btn-list-item';
        btnMain.style.flex = '1';
        btnMain.style.margin = '0';
        btnMain.onclick = () => startPlayer('custom', item.id);

        const contentDiv = document.createElement('div');
        contentDiv.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; width: 100%;';

        const nameSpan = document.createElement('span');
        nameSpan.style.cssText = 'font-weight: 800; font-size: 1.1rem; color: var(--md-sys-color-primary);';
        nameSpan.textContent = item.name;

        const descSpan = document.createElement('span');
        descSpan.style.cssText = 'font-size: 0.85rem; opacity: 0.7; margin-top: 4px;';
        descSpan.textContent = `${item.pages.length} Halaman (Total Target: ${item.pages.reduce((a, c) => a + c.target, 0)})`;

        contentDiv.appendChild(nameSpan);
        contentDiv.appendChild(descSpan);
        btnMain.appendChild(contentDiv);

        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn btn-icon-edit';
        btnEdit.setAttribute('aria-label', `Edit ${item.name}`);
        btnEdit.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
        btnEdit.onclick = () => openEditor('custom', item.id);

        const btnDel = document.createElement('button');
        btnDel.className = 'btn btn-icon-edit';
        btnDel.style.backgroundColor = 'rgba(255, 180, 171, 0.1)';
        btnDel.style.color = '#ffb4ab';
        btnDel.setAttribute('aria-label', `Hapus ${item.name}`);
        btnDel.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>`;
        btnDel.onclick = () => {
            showModal('Hapus Dzikir', 'Apakah Anda yakin ingin menghapus dzikir ini?', () => {
                state.customList.splice(index, 1);
                saveState();
                renderCustomList();
            });
        };

        wrapper.appendChild(btnMain);
        wrapper.appendChild(btnEdit);
        wrapper.appendChild(btnDel);
        container.appendChild(wrapper);
    });
}

export function openEditor(type, id = null) {
    editorType = type;
    editorId = id;

    const restoreBtn = document.getElementById('editor-btn-restore');
    if (restoreBtn) restoreBtn.style.display = (type !== 'custom' && type !== 'new') ? 'block' : 'none';
    const nameInput = document.getElementById('editor-input-name');
    if (nameInput) nameInput.disabled = (type !== 'custom' && type !== 'new');

    if (type === 'new') {
        editorSession = { id: Date.now(), name: '', pages: [{ id: Date.now() + 1, arabic: '', latin: '', translation: '', reference: '', target: 10 }] };
    } else if (type === 'custom') {
        const existing = state.customList.find(i => i.id == id);
        editorSession = JSON.parse(JSON.stringify(existing));
    } else {
        const d = getSessionData(type, null);
        editorSession = JSON.parse(JSON.stringify(d));
    }

    renderEditor();
    showPage('page-editor');
}

export function renderEditor() {
    const nameInput = document.getElementById('editor-input-name');
    if (nameInput) nameInput.value = editorSession.name;
    const container = document.getElementById('editor-pages-container');
    if (!container) return;

    container.innerHTML = '';

    editorSession.pages.forEach((page, index) => {
        if (!page.id) page.id = Date.now() + Math.random();

        const card = document.createElement('div');
        card.className = 'editor-page-card';

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 12px;';
        header.innerHTML = `<span style="font-weight:700; color:var(--md-sys-color-primary);">Halaman ${index + 1}</span>`;

        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display: flex; gap: 4px;';

        if (index > 0) {
            const btnUp = document.createElement('button');
            btnUp.className = 'btn btn-icon';
            btnUp.style.cssText = 'width: 32px; height: 32px; min-width: 32px;';
            btnUp.innerHTML = SVG_ICONS.arrowUp;
            btnUp.onclick = () => moveEditorPage(index, -1);
            btnGroup.appendChild(btnUp);
        }
        if (index < editorSession.pages.length - 1) {
            const btnDown = document.createElement('button');
            btnDown.className = 'btn btn-icon';
            btnDown.style.cssText = 'width: 32px; height: 32px; min-width: 32px;';
            btnDown.innerHTML = SVG_ICONS.arrowDown;
            btnDown.onclick = () => moveEditorPage(index, 1);
            btnGroup.appendChild(btnDown);
        }

        header.appendChild(btnGroup);
        card.appendChild(header);

        const inputs = [
            { key: 'target', label: 'Target Jumlah (*)', type: 'number', val: page.target },
            { key: 'arabic', label: 'Teks Arab', type: 'text', val: page.arabic },
            { key: 'latin', label: 'Teks Latin', type: 'text', val: page.latin },
            { key: 'translation', label: 'Terjemahan', type: 'textarea', val: page.translation },
            { key: 'reference', label: 'Referensi', type: 'text', val: page.reference }
        ];

        inputs.forEach(f => {
            const isTextarea = f.type === 'textarea';
            const el = document.createElement(isTextarea ? 'textarea' : 'input');
            if (!isTextarea) el.type = f.type;
            el.value = f.val || '';
            el.placeholder = f.label;
            el.oninput = (e) => {
                if (f.type === 'number') {
                    page[f.key] = parseInt(e.target.value) || 1;
                } else {
                    page[f.key] = e.target.value;
                }
            };
            card.appendChild(el);
        });

        const actions = document.createElement('div');
        actions.className = 'card-actions';

        const btnDel = document.createElement('button');
        btnDel.className = 'btn btn-icon-edit';
        btnDel.style.cssText = 'background-color: rgba(255, 180, 171, 0.1); color: #ffb4ab; width: 48px; height: 48px; min-width: 48px;';
        btnDel.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>`;
        btnDel.onclick = () => {
            if (editorSession.pages.length === 1) {
                showModal('Error', 'Sesi dzikir minimal harus memiliki 1 halaman.', null, true);
                return;
            }
            showModal('Hapus Halaman', 'Hapus halaman ke-' + (index + 1) + '?', () => {
                editorSession.pages.splice(index, 1);
                renderEditor();
            });
        };
        actions.appendChild(btnDel);
        card.appendChild(actions);
        container.appendChild(card);
    });
}

export function addEditorPage() {
    editorSession.pages.push({ id: Date.now(), arabic: '', latin: '', translation: '', reference: '', target: 10 });
    renderEditor();
}

export function removeEditorPage(index) {
    if (editorSession.pages.length === 1) {
        showModal('Error', 'Sesi minimal harus memiliki 1 halaman.', null, true);
        return;
    }
    showModal('Hapus Halaman', 'Hapus halaman bacaan ini?', () => {
        editorSession.pages.splice(index, 1);
        renderEditor();
    });
}

export function moveEditorPage(index, dir) {
    const targetIdx = index + dir;
    if (targetIdx < 0 || targetIdx >= editorSession.pages.length) return;

    const temp = editorSession.pages[index];
    editorSession.pages[index] = editorSession.pages[targetIdx];
    editorSession.pages[targetIdx] = temp;
    renderEditor();
}

export function saveEditorSession() {
    const nameInputEl = document.getElementById('editor-input-name');
    const nameInput = nameInputEl ? nameInputEl.value.trim() : '';
    if (editorType === 'custom' || editorType === 'new') {
        if (!nameInput) {
            showModal('Error', 'Nama dzikir tidak boleh kosong.', null, true);
            return;
        }
        editorSession.name = nameInput;
    }

    for (let p of editorSession.pages) {
        if (!p.target || p.target < 1) p.target = 1;
    }

    if (editorType === 'new') {
        state.customList.push(editorSession);
    } else if (editorType === 'custom') {
        const idx = state.customList.findIndex(i => i.id === editorId);
        if (idx >= 0) state.customList[idx] = editorSession;
    } else {
        state.guidedData[editorType] = editorSession.pages;
    }

    saveState();
    renderCustomList();
    showModal('Berhasil', 'Dzikir berhasil disimpan!', () => {
        showPage('page-menu');
    }, true);
}

export function confirmRestoreGuided() {
    showModal('Kembali ke Default', 'Apakah Anda yakin ingin mengembalikan bacaan ini ke setelan standar (sahih)? Semua editan Anda pada dzikir ini akan hilang.', () => {
        delete state.guidedData[editorType];
        saveState();
        showModal('Sukses', 'Berhasil dikembalikan ke default.', () => {
            showPage('page-menu');
        }, true);
    });
}
export async function showLibraryModal() {
    try {
        const searchInput = document.getElementById('library-search-input');
        if (searchInput) searchInput.value = '';

        const listContainer = document.getElementById('library-list');
        listContainer.innerHTML = '';
        
        azkarData.forEach(zkr => {
            const card = document.createElement('div');
            card.style.cssText = 'background: var(--md-sys-color-surface-variant); padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s;';
            card.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">${zkr.name}</div>
                <div style="font-size: 0.85rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" dir="rtl">${zkr.arabic}</div>
            `;
            card.onclick = () => {
                addFromLibrary(zkr);
                closeLibraryModal();
            };
            listContainer.appendChild(card);
        });

        if (state.customAzkar && state.customAzkar.length > 0) {
            const separator = document.createElement('div');
            separator.style.cssText = 'height: 1px; background: var(--md-sys-color-outline); opacity: 0.2; margin: 8px 0;';
            listContainer.appendChild(separator);

            const label = document.createElement('span');
            label.className = 'label-large text-sub';
            label.textContent = 'Dzikir Custom Anda';
            listContainer.appendChild(label);

            state.customAzkar.forEach((zkr, idx) => {
                const card = document.createElement('div');
                card.style.cssText = 'background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s; position: relative;';
                card.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 4px;">${zkr.name}</div>
                    <div style="font-size: 0.85rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" dir="rtl">${zkr.arabic || '-'}</div>
                    <button class="btn btn-icon" style="position: absolute; top: 8px; right: 8px; background: transparent; color: var(--md-sys-color-error);" onclick="event.stopPropagation(); window.deleteCustomAzkar(${idx})">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>
                    </button>
                `;
                card.onclick = () => {
                    addFromLibrary(zkr);
                    closeLibraryModal();
                };
                listContainer.appendChild(card);
            });
        }
        
        const modal = document.getElementById('library-modal');
        if (modal) modal.classList.add('active');
    } catch (e) {
        console.error('Failed to load Azkar Library', e);
        showModal('Error', 'Gagal memuat pustaka azkar.', null, true);
    }
}

export function closeLibraryModal() {
    const modal = document.getElementById('library-modal');
    if (modal) modal.classList.remove('active');
}

export function addFromLibrary(zkr) {
    if (!editorSession) return;
    editorSession.pages.push({
        id: Date.now() + Math.random(),
        arabic: zkr.arabic || '',
        latin: zkr.latin || '',
        translation: zkr.translation || '',
        reference: zkr.reference || '',
        target: zkr.target || 33
    });
    renderEditor();
}

export function openCustomAzkarModal() {
    const modal = document.getElementById('custom-azkar-modal');
    if (modal) {
        document.getElementById('custom-azkar-name').value = '';
        document.getElementById('custom-azkar-arabic').value = '';
        document.getElementById('custom-azkar-latin').value = '';
        document.getElementById('custom-azkar-target').value = 33;
        
        modal.classList.add('active');
    }
}

export function closeCustomAzkarModal() {
    const modal = document.getElementById('custom-azkar-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

export function saveCustomAzkar() {
    const name = document.getElementById('custom-azkar-name').value.trim();
    const arabic = document.getElementById('custom-azkar-arabic').value.trim();
    const latin = document.getElementById('custom-azkar-latin').value.trim();
    const target = parseInt(document.getElementById('custom-azkar-target').value) || 33;

    if (!name) {
        showModal('Error', 'Nama azkar wajib diisi.', null, true);
        return;
    }

    if (!state.customAzkar) state.customAzkar = [];
    state.customAzkar.push({ name, arabic, latin, target });
    saveState();
    
    closeCustomAzkarModal();
    showLibraryModal(); // Refresh the list
}

export function deleteCustomAzkar(index) {
    if (state.customAzkar && state.customAzkar[index]) {
        state.customAzkar.splice(index, 1);
        saveState();
        showLibraryModal(); // Refresh the list
    }
}

export function filterLibrary(query) {
    const listContainer = document.getElementById('library-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    const lowerQuery = query.toLowerCase().trim();
    
    // Filter default presets
    const filteredPresets = azkarData.filter(zkr => 
        (zkr.name && zkr.name.toLowerCase().includes(lowerQuery)) ||
        (zkr.arabic && zkr.arabic.toLowerCase().includes(lowerQuery)) ||
        (zkr.latin && zkr.latin.toLowerCase().includes(lowerQuery))
    );
    
    filteredPresets.forEach(zkr => {
        const card = document.createElement('div');
        card.style.cssText = 'background: var(--md-sys-color-surface-variant); padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s;';
        card.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">${zkr.name}</div>
            <div style="font-size: 0.85rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" dir="rtl">${zkr.arabic}</div>
        `;
        card.onclick = () => {
            addFromLibrary(zkr);
            closeLibraryModal();
        };
        listContainer.appendChild(card);
    });
    
    // Filter custom azkar
    if (state.customAzkar && state.customAzkar.length > 0) {
        const filteredCustom = state.customAzkar.map((zkr, idx) => ({ zkr, originalIdx: idx })).filter(item => 
            (item.zkr.name && item.zkr.name.toLowerCase().includes(lowerQuery)) ||
            (item.zkr.arabic && item.zkr.arabic.toLowerCase().includes(lowerQuery)) ||
            (item.zkr.latin && item.zkr.latin.toLowerCase().includes(lowerQuery))
        );
        
        if (filteredCustom.length > 0) {
            const separator = document.createElement('div');
            separator.style.cssText = 'height: 1px; background: var(--md-sys-color-outline); opacity: 0.2; margin: 8px 0;';
            listContainer.appendChild(separator);

            const label = document.createElement('span');
            label.className = 'label-large text-sub';
            label.textContent = 'Dzikir Custom Anda';
            listContainer.appendChild(label);

            filteredCustom.forEach(({ zkr, originalIdx }) => {
                const card = document.createElement('div');
                card.style.cssText = 'background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s; position: relative;';
                card.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 4px;">${zkr.name}</div>
                    <div style="font-size: 0.85rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" dir="rtl">${zkr.arabic || '-'}</div>
                    <button class="btn btn-icon" style="position: absolute; top: 8px; right: 8px; background: transparent; color: var(--md-sys-color-error);" onclick="event.stopPropagation(); window.deleteCustomAzkar(${originalIdx})">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>
                    </button>
                `;
                card.onclick = () => {
                    addFromLibrary(zkr);
                    closeLibraryModal();
                };
                listContainer.appendChild(card);
            });
        }
    }
}

// Bridging references to window globally for static index.html button bindings
if (typeof window !== 'undefined') {
    window.startPlayer = startPlayer;
    window.openEditor = openEditor;
    window.addEditorPage = addEditorPage;
    window.saveEditorSession = saveEditorSession;
    window.confirmRestoreGuided = confirmRestoreGuided;
    window.confirmResetPlayer = confirmResetPlayer;
    window.playerUndo = playerUndo;
    window.goToNextPlayerPage = goToNextPlayerPage;
    window.incrementPlayer = incrementPlayer;
    window.showLibraryModal = showLibraryModal;
    window.closeLibraryModal = closeLibraryModal;
    window.openCustomAzkarModal = openCustomAzkarModal;
    window.closeCustomAzkarModal = closeCustomAzkarModal;
    window.saveCustomAzkar = saveCustomAzkar;
    window.deleteCustomAzkar = deleteCustomAzkar;
    window.filterLibrary = filterLibrary;
}

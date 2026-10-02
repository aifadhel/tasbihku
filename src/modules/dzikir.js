/* ========================================================================= */
/* --- TasbihKu Dzikir Module (src/modules/dzikir.js) --- */
/* ========================================================================= */

import { state, saveState } from '../core/store.js';
import { t } from '../core/i18n.js';
import { vibrate, playTapSound } from '../hardware/media.js';
import { trackActivity, checkAndTriggerLinkedHabit, showStackingCelebrationToast } from './habits.js';
import { showModal, showPage, animateValue, triggerCelebration, SVG_ICONS } from '../ui/router.js';
import azkarData from '../data/azkar.json';
import { showToast } from '../ui/toast.js';

// Hardcoded Guided Readings Datasets
export const wiridReadings = [
    {
        arabic: "أَسْتَغْفِرُ اللَّهَ",
        latin: "Astaghfirullah.",
        translation: {
            id: "Aku memohon ampun kepada Allah.",
            en: "I seek forgiveness from Allah."
        },
        target: 3,
        reference: {
            id: "HR. Muslim no. 591",
            en: "Sahih Muslim no. 591"
        }
    },
    {
        arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ",
        latin: "Allahumma antas-salam, wa minkas-salam, tabarakta ya dzal-jalali wal-ikram.",
        translation: {
            id: "Ya Allah, Engkau adalah Maha Sejahtera (Pemberi keselamatan), dan dari-Mu keselamatan, Maha Berkah Engkau wahai Pemilik Keagungan dan Kemuliaan.",
            en: "O Allah, You are Peace, and from You comes peace. Blessed are You, O Owner of Majesty and Honor."
        },
        target: 1,
        reference: {
            id: "HR. Muslim no. 591",
            en: "Sahih Muslim no. 591"
        }
    },
    {
        arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ",
        latin: "Laa ilaha illallahu wahdahu laa syariika lah, lahul-mulku wa lahul-hamdu wa huwa 'alaa kulli syai-in qadiir. Allahumma laa maani'a limaa a'thaita, wa laa mu'thiya limaa mana'ta, wa laa yanfa'u dzal-jaddi minkal-jadd.",
        translation: {
            id: "Tidak ada tuhan yang berhak disembah selain Allah Yang Maha Esa, tiada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala puji, dan Dia Maha Kuasa atas segala sesuatu. Ya Allah, tidak ada yang dapat menghalangi apa yang Engkau berikan, dan tidak ada yang dapat memberi apa yang Engkau halangi, dan tidak bermanfaat kekayaan/kemuliaan bagi orang yang memilikinya dari (siksa)-Mu.",
            en: "There is no deity worthy of worship except Allah alone, without partner. To Him belongs the dominion and to Him is all praise, and He is capable of all things. O Allah, none can withhold what You give, none can give what You withhold, and the fortune of the wealthy cannot benefit them against You."
        },
        target: 1,
        reference: {
            id: "HR. Al-Bukhari no. 844, Muslim no. 593",
            en: "Sahih Al-Bukhari no. 844, Sahih Muslim no. 593"
        }
    },
    {
        arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَلَا نَعْبُدُ إِلَّا إِيَّاهُ، لَهُ النِّعْمَةُ وَلَهُ الْفَضْلُ وَلَهُ الثَّنَاءُ الْحَسَنُ، لَا إِلَهَ إِلَّا اللَّهُ مُخْلِصِينَ لَهُ الدِّينَ وَلَوْ كَرِهَ الْكَافِرُونَ",
        latin: "Laa ilaha illallahu wahdahu laa syariika lah, lahul-mulku wa lahul-hamdu wa huwa 'alaa kulli syai-in qadiir. Laa hawla wa laa quwwata illaa billah, laa ilaha illallahu wa laa na'budu illaa iyyaah, lahun-ni'matu wa lahul-fadhlu wa lahuts-tsanaa-ul-hasan, laa ilaha illallahu mukhlishiina lahud-diina wa law karihal-kaafiruun.",
        translation: {
            id: "Tidak ada tuhan yang berhak disembah selain Allah Yang Maha Esa, tiada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala puji, dan Dia Maha Kuasa atas segala sesuatu. Tidak ada daya dan kekuatan kecuali dengan (pertolongan) Allah. Tidak ada tuhan selain Allah, dan kami tidak menyembah kecuali hanya kepada-Nya. Bagi-Nya segala nikmat, anugerah, dan pujian yang baik. Tidak ada tuhan selain Allah dengan memurnikan ketaatan kepada-Nya meskipun orang-orang kafir membenci.",
            en: "There is no deity worthy of worship except Allah alone, without partner. To Him belongs the dominion and to Him is all praise, and He is capable of all things. There is no power and no strength except with Allah. There is no deity except Allah, and we worship none but Him. To Him belong all blessings, grace, and worthy praise. There is no deity except Allah, sincere to Him in religion, even if the disbelievers detest it."
        },
        target: 1,
        reference: {
            id: "HR. Muslim no. 594",
            en: "Sahih Muslim no. 594"
        }
    },
    {
        arabic: "سُبْحَانَ اللَّهِ",
        latin: "Subhanallah.",
        translation: {
            id: "Maha Suci Allah.",
            en: "Glory be to Allah."
        },
        target: 33,
        reference: {
            id: "HR. Muslim no. 597",
            en: "Sahih Muslim no. 597"
        }
    },
    {
        arabic: "الْحَمْدُ لِلَّهِ",
        latin: "Alhamdulillah.",
        translation: {
            id: "Segala puji bagi Allah.",
            en: "All praise is due to Allah."
        },
        target: 33,
        reference: {
            id: "HR. Muslim no. 597",
            en: "Sahih Muslim no. 597"
        }
    },
    {
        arabic: "اللَّهُ أَكْبَرُ",
        latin: "Allahu Akbar.",
        translation: {
            id: "Allah Maha Besar.",
            en: "Allah is the Greatest."
        },
        target: 33,
        reference: {
            id: "HR. Muslim no. 597",
            en: "Sahih Muslim no. 597"
        }
    },
    {
        arabic: "لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        latin: "Laa ilaha illallahu wahdahu laa syariika lah, lahul-mulku wa lahul-hamdu wa huwa 'alaa kulli syai-in qadiir.",
        translation: {
            id: "Tidak ada tuhan yang berhak disembah kecuali Allah Yang Maha Esa, tidak ada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala pujian, dan Dia Maha Kuasa atas segala sesuatu.",
            en: "There is no deity worthy of worship except Allah alone, without partner. To Him belongs the dominion, to Him belongs all praise, and He is capable of all things."
        },
        target: 1,
        reference: {
            id: "HR. Muslim no. 597 (Penggenap 100)",
            en: "Sahih Muslim no. 597 (Completing 100)"
        }
    },
    {
        arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
        latin: "Allahu laa ilaaha illaa huwal-hayyul-qayyum. Laa ta'khudzuhuu sinatuw wa laa naum. Lahuu maa fis-samaawaati wa maa fil-ardh. Man dzalladzii yasyfa'u 'indahuu illaa bi-idznih. Ya'lamu maa baina aidiihim wa maa khalfahum wa laa yuhiithuuna bisyai-im min 'ilmihii illaa bimaa syaa-a. Wasi'a kursiyyuhus-samaawaati wal-ardh, wa laa ya-uuduhuu hifzhuhumaa wa huwal-'aliyyul-'adzim.",
        translation: {
            id: "Allah, tidak ada tuhan yang berhak disembah selain Dia Yang Hidup kekal lagi terus menerus mengurus (makhluk-Nya). Tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan apa yang ada di bumi. Tiada yang dapat memberi syafaat di sisi Allah tanpa izin-Nya. Allah mengetahui apa-apa yang di hadapan mereka dan di belakang mereka, dan mereka tidak mengetahui apa-apa dari ilmu Allah melainkan apa yang dikehendaki-Nya. Kursi Allah meliputi langit dan bumi. Dan Allah tidak merasa berat memelihara keduanya, dan Allah Maha Tinggi lagi Maha Besar.",
            en: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great."
        },
        target: 1,
        reference: {
            id: "HR. An-Nasa'i As-Sunan Al-Kubra no. 9928, disahihkan Ibnu Hibban & Al-Albani",
            en: "Sunan An-Nasa'i & Al-Mu'jam Al-Kabir, authenticated by Al-Albani"
        }
    },
    {
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
        latin: "Bismillahir-rahmaanir-rahiim. Qul huwallaahu ahad. Allaahush-shamad. Lam yalid wa lam yuulad. Wa lam yakun lahuu kufuwan ahad.",
        translation: {
            id: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Katakanlah (Muhammad), Dialah Allah, Yang Maha Esa. Allah tempat meminta segala sesuatu. (Allah) tidak beranak dan tidak pula diperanakkan. Dan tidak ada sesuatu yang setara dengan Dia.",
            en: "In the name of Allah, the Entirely Merciful, the Especially Merciful. Say, He is Allah, [who is] One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent."
        },
        target: 1,
        reference: {
            id: "HR. Abu Daud no. 1523, An-Nasa'i no. 1336",
            en: "Sunan Abu Dawud no. 1523, Sunan An-Nasa'i no. 1336"
        }
    },
    {
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
        latin: "Bismillahir-rahmaanir-rahiim. Qul a'uudzu birabbil-falaq. Min syarri maa khalaq. Wa min syarri ghaasiqin idzaa waqab. Wa min syarrin-naffaatsaati fil-'uqad. Wa min syarri haasidin idzaa hasad.",
        translation: {
            id: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Katakanlah, Aku berlindung kepada Tuhan yang menguasai subuh (fajar), dari kejahatan (makhluk yang) Dia ciptakan, dan dari kejahatan malam apabila telah gelap gulita, dan dari kejahatan perempuan-perempuan (penyihir) yang meniup pada buhul-buhul (talinya), dan dari kejahatan orang yang dengki apabila dia dengki.",
            en: "In the name of Allah, the Entirely Merciful, the Especially Merciful. Say, I seek refuge in the Lord of daybreak from the evil of that which He created and from the evil of darkness when it settles and from the evil of the blowers in knots and from the evil of an envier when he envies."
        },
        target: 1,
        reference: {
            id: "HR. Abu Daud no. 1523, An-Nasa'i no. 1336",
            en: "Sunan Abu Dawud no. 1523, Sunan An-Nasa'i no. 1336"
        }
    },
    {
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
        latin: "Bismillahir-rahmaanir-rahiim. Qul a'uudzu birabbin-naas. Malikin-naas. Ilaahin-naas. Min syarril-waswaasil-khannaas. Alladzii yuwaswisu fii shuduurin-naas. Minal-jinnati wan-naas.",
        translation: {
            id: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Katakanlah, Aku berlindung kepada Tuhannya manusia, Raja manusia, Sembahan manusia, dari kejahatan (bisikan) setan yang bersembunyi, yang membisikkan (kejahatan) ke dalam dada manusia, dari (golongan) jin dan manusia.",
            en: "In the name of Allah, the Entirely Merciful, the Especially Merciful. Say, I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer who whispers into the breasts of mankind, from among the jinn and mankind."
        },
        target: 1,
        reference: {
            id: "HR. Abu Daud no. 1523, An-Nasa'i no. 1336",
            en: "Sunan Abu Dawud no. 1523, Sunan An-Nasa'i no. 1336"
        }
    },
    {
        arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
        latin: "Allahumma a'innii 'ala dzikrika wa syukrika wa husni 'ibadatik.",
        translation: {
            id: "Ya Allah, tolonglah aku untuk selalu berdzikir kepada-Mu, bersyukur kepada-Mu, dan memperbagus ibadah kepada-Mu.",
            en: "O Allah, help me to remember You, to give You thanks, and to worship You in an excellent manner."
        },
        target: 1,
        reference: {
            id: "HR. Abu Daud no. 1522, An-Nasa'i no. 1303, disahihkan Al-Albani",
            en: "Sunan Abu Dawud no. 1522, Sunan An-Nasa'i no. 1303, authenticated by Al-Albani"
        }
    },
    {
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا طَيِّبًا، وَعَمَلًا مُتَقَبَّلًا",
        latin: "Allahumma innii as-aluka 'ilman naafi'aa, wa rizqan thayyibaa, wa 'amalan mutaqabbalaa.",
        translation: {
            id: "Ya Allah, sesungguhnya aku memohon kepada-Mu ilmu yang bermanfaat, rezeki yang halal dan baik, serta amalan yang diterima.",
            en: "O Allah, I ask You for beneficial knowledge, good and lawful provision, and accepted deeds."
        },
        target: 1,
        reference: {
            id: "HR. Ibnu Majah no. 925, Ahmad 6/294 (Khusus Ba'da Subuh)",
            en: "Sunan Ibn Majah no. 925, Musnad Ahmad 6/294 (Recited after Fajr)"
        }
    }
];

export const dzikirPagi = [
    {
        arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
        latin: "Allahu laa ilaaha illaa huwal hayyul qayyum. Laa ta'khudzuhuu sinatuw wa laa naum. Lahuu maa fis samaawaati wa maa fil ardh. Man dzalladzii yasyfa'u 'indahuu illaa bi-idznih. Ya'lamu maa baina aidiihim wa maa khalfahum wa laa yuhiithuuna bisyai-im min 'ilmihii illaa bimaa syaa-a. Wasi'a kursiyyuhus samaawaati wal ardh, wa laa ya-uuduhuu hifzhuhumaa wa huwal 'aliyyul 'adzim.",
        translation: {
            id: "Allah, tidak ada tuhan yang berhak disembah selain Dia Yang Hidup kekal lagi terus menerus mengurus (makhluk-Nya). Tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan apa yang ada di bumi. Tiada yang dapat memberi syafaat di sisi Allah tanpa izin-Nya. Allah mengetahui apa-apa yang di hadapan mereka dan di belakang mereka, dan mereka tidak mengetahui apa-apa dari ilmu Allah melainkan apa yang dikehendaki-Nya. Kursi Allah meliputi langit dan bumi. Dan Allah tidak merasa berat memelihara keduanya, dan Allah Maha Tinggi lagi Maha Besar.",
            en: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great."
        },
        target: 1,
        reference: {
            id: "HR. An-Nasa'i & Al-Hakim 1/562, disahihkan oleh Al-Albani",
            en: "Sunan An-Nasa'i & Al-Hakim 1/562, authenticated by Al-Albani"
        }
    },
    {
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
        latin: "Bismillahir-rahmaanir-rahiim. Qul huwallaahu ahad. Allaahush-shamad. Lam yalid wa lam yuulad. Wa lam yakun lahuu kufuwan ahad.",
        translation: {
            id: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Katakanlah (Muhammad), Dialah Allah, Yang Maha Esa. Allah tempat meminta segala sesuatu. (Allah) tidak beranak dan tidak pula diperanakkan. Dan tidak ada sesuatu yang setara dengan Dia.",
            en: "In the name of Allah, the Entirely Merciful, the Especially Merciful. Say, He is Allah, [who is] One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent."
        },
        target: 3,
        reference: {
            id: "HR. Abu Daud no. 5082, At-Tirmidzi no. 3575",
            en: "Sunan Abu Dawud no. 5082, At-Tirmidhi no. 3575"
        }
    },
    {
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
        latin: "Bismillahir-rahmaanir-rahiim. Qul a'uudzu birabbil falaq. Min syarri maa khalaq. Wa min syarri ghaasiqin idzaa waqab. Wa min syarrin-naffaatsaati fil 'uqad. Wa min syarri haasidin idzaa hasad.",
        translation: {
            id: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Katakanlah, Aku berlindung kepada Tuhan yang menguasai subuh (fajar), dari kejahatan (makhluk yang) Dia ciptakan, dan dari kejahatan malam apabila telah gelap gulita, dan dari kejahatan perempuan-perempuan (penyihir) yang meniup pada buhul-buhul (talinya), dan dari kejahatan orang yang dengki apabila dia dengki.",
            en: "In the name of Allah, the Entirely Merciful, the Especially Merciful. Say, I seek refuge in the Lord of daybreak from the evil of that which He created and from the evil of darkness when it settles and from the evil of the blowers in knots and from the evil of an envier when he envies."
        },
        target: 3,
        reference: {
            id: "HR. Abu Daud no. 5082, At-Tirmidzi no. 3575",
            en: "Sunan Abu Dawud no. 5082, At-Tirmidhi no. 3575"
        }
    },
    {
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
        latin: "Bismillahir-rahmaanir-rahiim. Qul a'uudzu birabbin-naas. Malikin-naas. Ilaahin-naas. Min syarril waswaasil khannaas. Alladzii yuwaswisu fii shuduurin-naas. Minal jinnati wan-naas.",
        translation: {
            id: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Katakanlah, Aku berlindung kepada Tuhannya manusia, Raja manusia, Sembahan manusia, dari kejahatan (bisikan) setan yang bersembunyi, yang membisikkan (kejahatan) ke dalam dada manusia, dari (golongan) jin dan manusia.",
            en: "In the name of Allah, the Entirely Merciful, the Especially Merciful. Say, I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer who whispers into the breasts of mankind, from among the jinn and mankind."
        },
        target: 3,
        reference: {
            id: "HR. Abu Daud no. 5082, At-Tirmidzi no. 3575",
            en: "Sunan Abu Dawud no. 5082, At-Tirmidhi no. 3575"
        }
    },
    {
        arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
        latin: "Ashbahnaa wa ashbahal mulku lillah, wal hamdu lillah, laa ilaha illallahu wahdahu laa syarikalah, lahul mulku wal lahul hamdu wa huwa 'ala kulli syai'in qadir. Rabbi as-aluka khaira maa fii haadzal yaumi wa khaira maa ba'dahu, wa a'uudzu bika min syarri maa fii haadzal yaumi wa syarri maa ba'dahu. Rabbi a'uudzu bika minal kasali wa suu-il kibar, rabbi a'uudzu bika min 'adzaabin fin naari wa 'adzaabin fil qabr.",
        translation: {
            id: "Kami telah memasuki waktu pagi dan kerajaan hanya milik Allah, segala puji bagi Allah. Tidak ada tuhan yang berhak disembah kecuali Allah Yang Maha Esa, tiada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala pujian, dan Dia Maha Kuasa atas segala sesuatu. Wahai Tuhanku, aku memohon kepada-Mu kebaikan di hari ini dan kebaikan sesudahnya. Dan aku berlindung kepada-Mu dari keburukan di hari ini dan keburukan sesudahnya. Wahai Tuhanku, aku berlindung kepada-Mu dari kemalasan dan keburukan di hari tua. Wahai Tuhanku, aku berlindung kepada-Mu dari siksa neraka dan siksa kubur.",
            en: "We have entered upon the morning and the dominion belongs to Allah, and all praise is due to Allah. There is no deity except Allah alone, without partner. To Him belongs the dominion and to Him is all praise, and He is capable of all things. My Lord, I ask You for the good of what is in this day and the good of what comes after it, and I seek refuge in You from the evil of what is in this day and the evil of what comes after it. My Lord, I seek refuge in You from laziness and the hardships of old age. My Lord, I seek refuge in You from torment in the Fire and torment in the grave."
        },
        target: 1,
        reference: {
            id: "HR. Muslim no. 2723",
            en: "Sahih Muslim no. 2723"
        }
    },
    {
        arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ",
        latin: "Allahumma bika ashbahnaa, wa bika amsainaa, wa bika nahyaa, wa bika namuutu wa ilaikan nusyuur.",
        translation: {
            id: "Ya Allah, dengan rahmat-Mu kami memasuki waktu pagi, dan dengan rahmat-Mu kami memasuki waktu sore. Dengan-Mu kami hidup dan dengan-Mu kami mati. Dan kepada-Mu kami dibangkitkan.",
            en: "O Allah, by You we enter the morning, and by You we enter the evening. By You we live, and by You we die, and unto You is the resurrection."
        },
        target: 1,
        reference: {
            id: "HR. At-Tirmidzi no. 3391, Abu Daud no. 5068",
            en: "Sunan At-Tirmidhi no. 3391, Sunan Abu Dawud no. 5068"
        }
    },
    {
        arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        latin: "Allahumma anta rabbii laa ilaha illaa ant, khalaqtanii wa anaa 'abduk, wa anaa 'ala 'ahdika wa wa'dika mastatha'tu. A'uudzu bika min syarri maa shana'tu, abuu-u laka bini'matika 'alay, wa abuu-u bizanbii faghfirlii fa innahu laa yaghfirudz dzunuuba illaa ant.",
        translation: {
            id: "Ya Allah, Engkau adalah Tuhanku, tidak ada tuhan yang berhak disembah kecuali Engkau. Engkau yang menciptakan aku dan aku adalah hamba-Mu. Aku di atas ikatan dan janji-Mu semampuku. Aku berlindung kepada-Mu dari kejahatan yang aku perbuat. Aku mengakui nikmat-Mu kepadaku dan aku mengakui dosaku, maka ampunilah aku. Sesungguhnya tidak ada yang dapat mengampuni dosa kecuali Engkau.",
            en: "O Allah, You are my Lord; there is no deity except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me, for none forgives sins except You."
        },
        target: 1,
        reference: {
            id: "HR. Al-Bukhari no. 6306 (Sayyidul Istighfar)",
            en: "Sahih Al-Bukhari no. 6306 (Sayyidul Istighfar)"
        }
    },
    {
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَنْ شِمَالِي وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي",
        latin: "Allahumma innii as-alukal 'afwa wal 'aafiyata fid dunyaa wal aakhirah. Allahumma innii as-alukal 'afwa wal 'aafiyata fii diinii wa dunyaaya wa ahlii wa maalii. Allahummastur 'auraatii wa aamin rau'aatii. Allahummahfazhnii mim baini yadayya wa min khalfii wa 'an yamiinii wa 'an syimaalii wa min fauqii, wa a'uudzu bi'azhamatika an ughtaala min tahtii.",
        translation: {
            id: "Ya Allah, sesungguhnya aku memohon ampunan dan keselamatan di dunia dan akhirat. Ya Allah, sesungguhnya aku memohon ampunan dan keselamatan dalam agamaku, duniaku, keluargaku, dan hartaku. Ya Allah, tutupilah auratku (aib dan kelemahanku) dan tenangkanlah rasa takutku. Ya Allah, jagalah aku dari arah depanku, dari belakangku, dari kananku, dari kiriku, dan dari atasku. Dan aku berlindung dengan keagungan-Mu agar aku tidak diserang secara tiba-tiba dari bawahku.",
            en: "O Allah, I ask You for forgiveness and well-being in this world and the Hereafter. O Allah, I ask You for forgiveness and well-being in my religion, worldly affairs, family, and wealth. O Allah, conceal my faults and calm my fears. O Allah, protect me from in front of me, behind me, on my right, on my left, and from above me. And I seek refuge in Your greatness from being assassinated from beneath me."
        },
        target: 1,
        reference: {
            id: "HR. Abu Daud no. 5074, Ibnu Majah no. 3871",
            en: "Sunan Abu Dawud no. 5074, Ibn Majah no. 3871"
        }
    },
    {
        arabic: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ",
        latin: "Allahumma 'aafinii fii badanii, allahumma 'aafinii fii sam'ii, allahumma 'aafinii fii basharii, laa ilaha illaa ant. Allahumma innii a'uudzu bika minal kufri wal faqr, wa a'uudzu bika min 'adzaabil qabr, laa ilaha illaa ant.",
        translation: {
            id: "Ya Allah, sehatkanlah badanku. Ya Allah, sehatkanlah pendengaranku. Ya Allah, sehatkanlah penglihatanku. Tidak ada tuhan yang berhak disembah kecuali Engkau. Ya Allah, sesungguhnya aku berlindung kepada-Mu dari kekufuran dan kefakiran. Dan aku berlindung kepada-Mu dari siksa kubur. Tidak ada tuhan yang berhak disembah kecuali Engkau.",
            en: "O Allah, grant well-being to my body. O Allah, grant well-being to my hearing. O Allah, grant well-being to my sight. There is no deity except You. O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the torment of the grave. There is no deity except You."
        },
        target: 3,
        reference: {
            id: "HR. Abu Daud no. 5090, Ahmad 5/42",
            en: "Sunan Abu Dawud no. 5090, Ahmad 5/42"
        }
    },
    {
        arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        latin: "Bismillahilladzii laa yadhurru ma'asmihi syai-un fil ardhi wa laa fis samaa-i wa huwas samii'ul 'aliim.",
        translation: {
            id: "Dengan nama Allah yang dengan nama-Nya tidak ada sesuatu pun di bumi dan di langit yang dapat mendatangkan bahaya, dan Dia Maha Mendengar lagi Maha Mengetahui.",
            en: "In the name of Allah, with whose name nothing on earth or in the heavens can cause harm, and He is the Hearing, the Knowing."
        },
        target: 3,
        reference: {
            id: "HR. Abu Daud no. 5088, At-Tirmidzi no. 3388",
            en: "Sunan Abu Dawud no. 5088, At-Tirmidhi no. 3388"
        }
    },
    {
        arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
        latin: "Radhiitu billaahi rabbaa, wa bil-islaami diinaa, wa bi-Muhammadin shallallaahu 'alayhi wa sallama nabiyyaa.",
        translation: {
            id: "Aku rela Allah sebagai Tuhanku, Islam sebagai agamaku, dan Muhammad shallallahu 'alaihi wa sallam sebagai nabiku.",
            en: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace and blessings of Allah be upon him) as my Prophet."
        },
        target: 3,
        reference: {
            id: "HR. Abu Daud no. 5072, Ahmad 4/337, disahihkan Al-Albani",
            en: "Sunan Abu Dawud no. 5072, Ahmad 4/337, authenticated by Al-Albani"
        }
    },
    {
        arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
        latin: "Yaa Hayyu yaa Qayyuum, bi-rahmatika astaghiits, ashlih lii sya'nii kullahu, wa laa takilnii ilaa nafsii tharfata 'ain.",
        translation: {
            id: "Wahai Yang Maha Hidup, wahai Yang Berdiri Sendiri tidak membutuhkan segala sesuatu, dengan rahmat-Mu aku memohon pertolongan. Perbaikilah seluruh urusanku, dan janganlah Engkau serahkan aku kepada diriku sendiri walau sekejap mata.",
            en: "O Ever-Living, O Self-Sustaining, by Your mercy I seek help. Rectify all of my affairs, and do not leave me to myself even for the blink of an eye."
        },
        target: 1,
        reference: {
            id: "HR. An-Nasa'i As-Sunan Al-Kubra no. 10405, Al-Hakim 1/545",
            en: "Sunan An-Nasa'i As-Sunan Al-Kubra no. 10405, Al-Hakim 1/545"
        }
    },
    {
        arabic: "أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ",
        latin: "Ashbahnaa 'ala fithratil islaam, wa 'ala kalimatil ikhlaash, wa 'ala diini nabiyyinaa Muhammadin shallallaahu 'alayhi wa sallam, wa 'ala millati abiinaa Ibraahiima haniifam muslimaw wa maa kaana minal musyrikiin.",
        translation: {
            id: "Di waktu pagi kami memegang teguh fitrah Islam, kalimat ikhlas (tauhid), agama nabi kami Muhammad shallallahu 'alaihi wa sallam, dan millah (ajaran) bapak kami Ibrahim yang hanif (lurus) lagi berserah diri kepada Allah, dan sekali-kali bukanlah dia termasuk orang-orang musyrik.",
            en: "We enter upon the morning upon the natural disposition of Islam, the word of sincere faith, the religion of our Prophet Muhammad (peace be upon him), and the faith of our father Abraham, who was true in faith, a Muslim, and was not of the polytheists."
        },
        target: 1,
        reference: {
            id: "HR. Ahmad 3/406, 407, Sahih Al-Jami' no. 4674",
            en: "Musnad Ahmad 3/406, 407, Sahih Al-Jami' no. 4674"
        }
    },
    {
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ",
        latin: "Subhaanallaahi wa bihamdih, 'adada khalqih, wa ridhaa nafsih, wa zinata 'arsyih, wa midaada kalimaatih.",
        translation: {
            id: "Maha Suci Allah dan segala puji bagi-Nya, sebanyak bilangan makhluk-Nya, seridha diri-Nya, seberat timbangan 'Arsy-Nya, dan sebanyak tinta kalimat-kalimat-Nya.",
            en: "Glory be to Allah and all praise is due to Him, by the number of His creation, according to His good pleasure, by the weight of His Throne, and by the ink of His words."
        },
        target: 3,
        reference: {
            id: "HR. Muslim no. 2726 (Hadits Juwairiyah)",
            en: "Sahih Muslim no. 2726 (Hadith Juwairiyah)"
        }
    },
    {
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        latin: "Subhaanallaahi wa bihamdih.",
        translation: {
            id: "Maha Suci Allah dan segala puji bagi-Nya.",
            en: "Glory be to Allah and all praise is due to Him."
        },
        target: 100,
        reference: {
            id: "HR. Muslim no. 2692",
            en: "Sahih Muslim no. 2692"
        }
    },
    {
        arabic: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        latin: "Laa ilaha illallahu wahdahu laa syarikalah, lahul mulku wa lahul hamdu wa huwa 'ala kulli syai'in qadir.",
        translation: {
            id: "Tidak ada tuhan yang berhak disembah kecuali Allah Yang Maha Esa, tidak ada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala pujian, dan Dia Maha Kuasa atas segala sesuatu.",
            en: "There is no deity worthy of worship except Allah alone, without partner. To Him belongs the dominion, to Him belongs all praise, and He is capable of all things."
        },
        target: 10,
        reference: {
            id: "HR. Abu Daud no. 5077",
            en: "Sunan Abu Dawud no. 5077"
        }
    },
    {
        arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
        latin: "Astaghfirullaha wa atuubu ilaih.",
        translation: {
            id: "Aku memohon ampunan Allah dan bertaubat kepada-Nya.",
            en: "I seek the forgiveness of Allah and repent to Him."
        },
        target: 100,
        reference: {
            id: "HR. Al-Bukhari no. 6307, Muslim no. 2702",
            en: "Sahih Al-Bukhari no. 6307, Muslim no. 2702"
        }
    }
];

export const dzikirPetang = [
    {
        arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
        latin: "Allahu laa ilaaha illaa huwal hayyul qayyum. Laa ta'khudzuhuu sinatuw wa laa naum. Lahuu maa fis samaawaati wa maa fil ardh. Man dzalladzii yasyfa'u 'indahuu illaa bi-idznih. Ya'lamu maa baina aidiihim wa maa khalfahum wa laa yuhiithuuna bisyai-im min 'ilmihii illaa bimaa syaa-a. Wasi'a kursiyyuhus samaawaati wal ardh, wa laa ya-uuduhuu hifzhuhumaa wa huwal 'aliyyul 'adzim.",
        translation: {
            id: "Allah, tidak ada tuhan yang berhak disembah selain Dia Yang Hidup kekal lagi terus menerus mengurus (makhluk-Nya). Tidak mengantuk dan tidak tidur. Milik-Nya apa yang ada di langit dan apa yang ada di bumi. Tiada yang dapat memberi syafaat di sisi Allah tanpa izin-Nya. Allah mengetahui apa-apa yang di hadapan mereka dan di belakang mereka, dan mereka tidak mengetahui apa-apa dari ilmu Allah melainkan apa yang dikehendaki-Nya. Kursi Allah meliputi langit dan bumi. Dan Allah tidak merasa berat memelihara keduanya, dan Allah Maha Tinggi lagi Maha Besar.",
            en: "Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is [presently] before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Kursi extends over the heavens and the earth, and their preservation tires Him not. And He is the Most High, the Most Great."
        },
        target: 1,
        reference: {
            id: "HR. An-Nasa'i & Al-Hakim 1/562, disahihkan oleh Al-Albani",
            en: "Sunan An-Nasa'i & Al-Hakim 1/562, authenticated by Al-Albani"
        }
    },
    {
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ",
        latin: "Bismillahir-rahmaanir-rahiim. Qul huwallaahu ahad. Allaahush-shamad. Lam yalid wa lam yuulad. Wa lam yakun lahuu kufuwan ahad.",
        translation: {
            id: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Katakanlah (Muhammad), Dialah Allah, Yang Maha Esa. Allah tempat meminta segala sesuatu. (Allah) tidak beranak dan tidak pula diperanakkan. Dan tidak ada sesuatu yang setara dengan Dia.",
            en: "In the name of Allah, the Entirely Merciful, the Especially Merciful. Say, He is Allah, [who is] One. Allah, the Eternal Refuge. He neither begets nor is born, nor is there to Him any equivalent."
        },
        target: 3,
        reference: {
            id: "HR. Abu Daud no. 5082, At-Tirmidzi no. 3575",
            en: "Sunan Abu Dawud no. 5082, At-Tirmidhi no. 3575"
        }
    },
    {
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِنْ شَرِّ مَا خَلَقَ ۝ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ",
        latin: "Bismillahir-rahmaanir-rahiim. Qul a'uudzu birabbil falaq. Min syarri maa khalaq. Wa min syarri ghaasiqin idzaa waqab. Wa min syarrin-naffaatsaati fil 'uqad. Wa min syarri haasidin idzaa hasad.",
        translation: {
            id: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Katakanlah, Aku berlindung kepada Tuhan yang menguasai subuh (fajar), dari kejahatan (makhluk yang) Dia ciptakan, dan dari kejahatan malam apabila telah gelap gulita, dan dari kejahatan perempuan-perempuan (penyihir) yang meniup pada buhul-buhul (talinya), dan dari kejahatan orang yang dengki apabila dia dengki.",
            en: "In the name of Allah, the Entirely Merciful, the Especially Merciful. Say, I seek refuge in the Lord of daybreak from the evil of that which He created and from the evil of darkness when it settles and from the evil of the blowers in knots and from the evil of an envier when he envies."
        },
        target: 3,
        reference: {
            id: "HR. Abu Daud no. 5082, At-Tirmidzi no. 3575",
            en: "Sunan Abu Dawud no. 5082, At-Tirmidhi no. 3575"
        }
    },
    {
        arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
        latin: "Bismillahir-rahmaanir-rahiim. Qul a'uudzu birabbin-naas. Malikin-naas. Ilaahin-naas. Min syarril waswaasil khannaas. Alladzii yuwaswisu fii shuduurin-naas. Minal jinnati wan-naas.",
        translation: {
            id: "Dengan nama Allah Yang Maha Pengasih, Maha Penyayang. Katakanlah, Aku berlindung kepada Tuhannya manusia, Raja manusia, Sembahan manusia, dari kejahatan (bisikan) setan yang bersembunyi, yang membisikkan (kejahatan) ke dalam dada manusia, dari (golongan) jin dan manusia.",
            en: "In the name of Allah, the Entirely Merciful, the Especially Merciful. Say, I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer who whispers into the breasts of mankind, from among the jinn and mankind."
        },
        target: 3,
        reference: {
            id: "HR. Abu Daud no. 5082, At-Tirmidzi no. 3575",
            en: "Sunan Abu Dawud no. 5082, At-Tirmidhi no. 3575"
        }
    },
    {
        arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
        latin: "Amsainaa wa amsal mulku lillah, wal hamdu lillah, laa ilaha illallahu wahdahu laa syarikalah, lahul mulku wal lahul hamdu wa huwa 'ala kulli syai'in qadir. Rabbi as-aluka khaira maa fii haadzihil lailati wa khaira maa ba'dahaa, wa a'uudzu bika min syarri maa fii haadzihil lailati wa syarri maa ba'dahaa. Rabbi a'uudzu bika minal kasali wa suu-il kibar, rabbi a'uudzu bika min 'adzaabin fin naari wa 'adzaabin fil qabr.",
        translation: {
            id: "Kami telah memasuki waktu sore dan kerajaan hanya milik Allah, segala puji bagi Allah. Tidak ada tuhan yang berhak disembah kecuali Allah Yang Maha Esa, tiada sekutu bagi-Nya. Bagi-Nya kerajaan dan bagi-Nya segala pujian, dan Dia Maha Kuasa atas segala sesuatu. Wahai Tuhanku, aku memohon kepada-Mu kebaikan di malam ini dan kebaikan sesudahnya. Dan aku berlindung kepada-Mu dari keburukan di malam ini dan keburukan sesudahnya. Wahai Tuhanku, aku berlindung kepada-Mu dari kemalasan dan keburukan di hari tua. Wahai Tuhanku, aku berlindung kepada-Mu dari siksa neraka dan siksa kubur.",
            en: "We have reached the evening and dominion belongs to Allah, and all praise is due to Allah. There is no deity except Allah alone, without partner. To Him belongs the dominion and to Him is all praise, and He is capable of all things. My Lord, I ask You for the good of what is in this night and the good of what comes after it, and I seek refuge in You from the evil of what is in this night and the evil of what comes after it. My Lord, I seek refuge in You from laziness and the hardships of old age. My Lord, I seek refuge in You from torment in the Fire and torment in the grave."
        },
        target: 1,
        reference: {
            id: "HR. Muslim no. 2723",
            en: "Sahih Muslim no. 2723"
        }
    },
    {
        arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
        latin: "Allahumma bika amsainaa, wa bika ashbahnaa, wa bika nahyaa, wa bika namuutu wa ilaikal mashiir.",
        translation: {
            id: "Ya Allah, dengan rahmat-Mu kami memasuki waktu sore, dan dengan rahmat-Mu kami memasuki waktu pagi. Dengan-Mu kami hidup dan dengan-Mu kami mati. Dan kepada-Mu kami kembali.",
            en: "O Allah, by You we enter the evening, and by You we enter the morning. By You we live, and by You we die, and unto You is the return."
        },
        target: 1,
        reference: {
            id: "HR. At-Tirmidzi no. 3391",
            en: "Sunan At-Tirmidhi no. 3391"
        }
    },
    {
        arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
        latin: "Allahumma anta rabbii laa ilaha illaa ant, khalaqtanii wa anaa 'abduk, wa anaa 'ala 'ahdika wa wa'dika mastatha'tu. A'uudzu bika min syarri maa shana'tu, abuu-u laka bini'matika 'alay, wa abuu-u bizanbii faghfirlii fa innahu laa yaghfirudz dzunuuba illaa ant.",
        translation: {
            id: "Ya Allah, Engkau adalah Tuhanku, tidak ada tuhan yang berhak disembah kecuali Engkau. Engkau yang menciptakan aku dan aku adalah hamba-Mu. Aku di atas ikatan dan janji-Mu semampuku. Aku berlindung kepada-Mu dari kejahatan yang aku perbuat. Aku mengakui nikmat-Mu kepadaku dan aku mengakui dosaku, maka ampunilah aku. Sesungguhnya tidak ada yang dapat mengampuni dosa kecuali Engkau.",
            en: "O Allah, You are my Lord; there is no deity except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me and I acknowledge my sin, so forgive me, for none forgives sins except You."
        },
        target: 1,
        reference: {
            id: "HR. Al-Bukhari no. 6306 (Sayyidul Istighfar)",
            en: "Sahih Al-Bukhari no. 6306 (Sayyidul Istighfar)"
        }
    },
    {
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي، اللَّهُمَّ احْفَظْنِي مِنْ بَيْنِ يَدَيَّ وَمِنْ خَلْفِي وَعَنْ يَمِينِي وَعَنْ شِمَالِي وَمِنْ فَوْقِي، وَأَعُوذُ بِعَظَمَتِكَ أَنْ أُغْتَالَ مِنْ تَحْتِي",
        latin: "Allahumma innii as-alukal 'afwa wal 'aafiyata fid dunyaa wal aakhirah. Allahumma innii as-alukal 'afwa wal 'aafiyata fii diinii wa dunyaaya wa ahlii wa maalii. Allahummastur 'auraatii wa aamin rau'aatii. Allahummahfazhnii mim baini yadayya wa min khalfii wa 'an yamiinii wa 'an syimaalii wa min fauqii, wa a'uudzu bi'azhamatika an ughtaala min tahtii.",
        translation: {
            id: "Ya Allah, sesungguhnya aku memohon ampunan dan keselamatan di dunia dan akhirat. Ya Allah, sesungguhnya aku memohon ampunan dan keselamatan dalam agamaku, duniaku, keluargaku, dan hartaku. Ya Allah, tutupilah auratku (aib dan kelemahanku) dan tenangkanlah rasa takutku. Ya Allah, jagalah aku dari arah depanku, dari belakangku, dari kananku, dari kiriku, dan dari atasku. Dan aku berlindung dengan keagungan-Mu agar aku tidak diserang secara tiba-tiba dari bawahku.",
            en: "O Allah, I ask You for forgiveness and well-being in this world and the Hereafter. O Allah, I ask You for forgiveness and well-being in my religion, worldly affairs, family, and wealth. O Allah, conceal my faults and calm my fears. O Allah, protect me from in front of me, behind me, on my right, on my left, and from above me. And I seek refuge in Your greatness from being assassinated from beneath me."
        },
        target: 1,
        reference: {
            id: "HR. Abu Daud no. 5074, Ibnu Majah no. 3871",
            en: "Sunan Abu Dawud no. 5074, Ibn Majah no. 3871"
        }
    },
    {
        arabic: "اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ",
        latin: "Allahumma 'aafinii fii badanii, allahumma 'aafinii fii sam'ii, allahumma 'aafinii fii basharii, laa ilaha illaa ant. Allahumma innii a'uudzu bika minal kufri wal faqr, wa a'uudzu bika min 'adzaabil qabr, laa ilaha illaa ant.",
        translation: {
            id: "Ya Allah, sehatkanlah badanku. Ya Allah, sehatkanlah pendengaranku. Ya Allah, sehatkanlah penglihatanku. Tidak ada tuhan yang berhak disembah kecuali Engkau. Ya Allah, sesungguhnya aku berlindung kepada-Mu dari kekufuran dan kefakiran. Dan aku berlindung kepada-Mu dari siksa kubur. Tidak ada tuhan yang berhak disembah kecuali Engkau.",
            en: "O Allah, grant well-being to my body. O Allah, grant well-being to my hearing. O Allah, grant well-being to my sight. There is no deity except You. O Allah, I seek refuge in You from disbelief and poverty, and I seek refuge in You from the torment of the grave. There is no deity except You."
        },
        target: 3,
        reference: {
            id: "HR. Abu Daud no. 5090, Ahmad 5/42",
            en: "Sunan Abu Dawud no. 5090, Ahmad 5/42"
        }
    },
    {
        arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
        latin: "Bismillahilladzii laa yadhurru ma'asmihi syai-un fil ardhi wa laa fis samaa-i wa huwas samii'ul 'aliim.",
        translation: {
            id: "Dengan nama Allah yang dengan nama-Nya tidak ada sesuatu pun di bumi dan di langit yang dapat mendatangkan bahaya, dan Dia Maha Mendengar lagi Maha Mengetahui.",
            en: "In the name of Allah, with whose name nothing on earth or in the heavens can cause harm, and He is the Hearing, the Knowing."
        },
        target: 3,
        reference: {
            id: "HR. Abu Daud no. 5088, At-Tirmidzi no. 3388",
            en: "Sunan Abu Dawud no. 5088, At-Tirmidhi no. 3388"
        }
    },
    {
        arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ",
        latin: "A'uudzu bikalimaatillahit taammaati min syarri maa khalaq.",
        translation: {
            id: "Aku berlindung dengan kalimat-kalimat Allah yang sempurna dari kejahatan makhluk yang Dia ciptakan.",
            en: "I seek refuge in the perfect words of Allah from the evil of what He has created."
        },
        target: 3,
        reference: {
            id: "HR. Muslim no. 2709, At-Tirmidzi no. 3393",
            en: "Sahih Muslim no. 2709, At-Tirmidhi no. 3393"
        }
    },
    {
        arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا",
        latin: "Radhiitu billaahi rabbaa, wa bil-islaami diinaa, wa bi-Muhammadin shallallaahu 'alayhi wa sallama nabiyyaa.",
        translation: {
            id: "Aku rela Allah sebagai Tuhanku, Islam sebagai agamaku, dan Muhammad shallallahu 'alaihi wa sallam sebagai nabiku.",
            en: "I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace and blessings of Allah be upon him) as my Prophet."
        },
        target: 3,
        reference: {
            id: "HR. Abu Daud no. 5072, Ahmad 4/337, disahihkan Al-Albani",
            en: "Sunan Abu Dawud no. 5072, Ahmad 4/337, authenticated by Al-Albani"
        }
    },
    {
        arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
        latin: "Yaa Hayyu yaa Qayyuum, bi-rahmatika astaghiits, ashlih lii sya'nii kullahu, wa laa takilnii ilaa nafsii tharfata 'ain.",
        translation: {
            id: "Wahai Yang Maha Hidup, wahai Yang Berdiri Sendiri tidak membutuhkan segala sesuatu, dengan rahmat-Mu aku memohon pertolongan. Perbaikilah seluruh urusanku, dan janganlah Engkau serahkan aku kepada diriku sendiri walau sekejap mata.",
            en: "O Ever-Living, O Self-Sustaining, by Your mercy I seek help. Rectify all of my affairs, and do not leave me to myself even for the blink of an eye."
        },
        target: 1,
        reference: {
            id: "HR. An-Nasa'i As-Sunan Al-Kubra no. 10405, Al-Hakim 1/545",
            en: "Sunan An-Nasa'i As-Sunan Al-Kubra no. 10405, Al-Hakim 1/545"
        }
    },
    {
        arabic: "أَمْسَيْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفًا مُسْلِمًا وَمَا كَانَ مِنَ الْمُشْرِكِينَ",
        latin: "Amsainaa 'ala fithratil islaam, wa 'ala kalimatil ikhlaash, wa 'ala diini nabiyyinaa Muhammadin shallallaahu 'alayhi wa sallam, wa 'ala millati abiinaa Ibraahiima haniifam muslimaw wa maa kaana minal musyrikiin.",
        translation: {
            id: "Di waktu sore kami memegang teguh fitrah Islam, kalimat ikhlas (tauhid), agama nabi kami Muhammad shallallahu 'alaihi wa sallam, dan millah (ajaran) bapak kami Ibrahim yang hanif (lurus) lagi berserah diri kepada Allah, dan sekali-kali bukanlah dia termasuk orang-orang musyrik.",
            en: "We enter upon the evening upon the natural disposition of Islam, the word of sincere faith, the religion of our Prophet Muhammad (peace be upon him), and the faith of our father Abraham, who was true in faith, a Muslim, and was not of the polytheists."
        },
        target: 1,
        reference: {
            id: "HR. Ahmad 3/406, 407, Sahih Al-Jami' no. 4674",
            en: "Musnad Ahmad 3/406, 407, Sahih Al-Jami' no. 4674"
        }
    },
    {
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
        latin: "Subhaanallaahi wa bihamdih.",
        translation: {
            id: "Maha Suci Allah dan segala puji bagi-Nya.",
            en: "Glory be to Allah and all praise is due to Him."
        },
        target: 100,
        reference: {
            id: "HR. Muslim no. 2692",
            en: "Sahih Muslim no. 2692"
        }
    },
    {
        arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
        latin: "Astaghfirullaha wa atuubu ilaih.",
        translation: {
            id: "Aku memohon ampunan Allah dan bertaubat kepada-Nya.",
            en: "I seek the forgiveness of Allah and repent to Him."
        },
        target: 100,
        reference: {
            id: "HR. Al-Bukhari no. 6307, Muslim no. 2702",
            en: "Sahih Al-Bukhari no. 6307, Muslim no. 2702"
        }
    }
];

/**
 * Resolves a localized string from either a plain string or an i18n object { id, en }.
 * @param {string|object|null|undefined} val
 * @param {string} [lang]
 * @returns {string}
 */
export function getLocalizedText(val, lang = state.language || 'id') {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
        return val[lang] || val.id || val.en || '';
    }
    return String(val);
}

// Editor Session state
export let editorSession = null;
export let editorType = null;
export let editorId = null;

let playerAutoSkipTimeout = null;
let lastRenderedPlayerIndex = -1;
let lastPlayerTapTime = 0;

export function getSessionData(type, id) {
    let rawPages = [];
    let name = t('player_title_default');

    if (type === 'custom') {
        const item = state.customList.find(i => i.id == id);
        if (item) {
            name = item.name;
            rawPages = item.pages;
        }
    } else {
        if (type === 'pagi') { name = t('dzikir_pagi_title'); rawPages = state.guidedData.pagi || dzikirPagi; }
        else if (type === 'petang') { name = t('dzikir_petang_title'); rawPages = state.guidedData.petang || dzikirPetang; }
        else if (type === 'wirid') { name = t('wirid_title'); rawPages = state.guidedData.wirid || wiridReadings; }
    }

    return { name, pages: rawPages };
}

export function startPlayer(type, id = null) {
    trackActivity();
    lastRenderedPlayerIndex = -1;
    state.playerType = type;
    state.playerId = id;
    state.playerIndex = 0;
    state.playerCount = 0;
    saveState();

    const d = getSessionData(type, id);
    if (!d.pages || d.pages.length === 0) {
        showModal(t('modal_empty_title'), t('modal_empty_msg'), null, true);
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

    const scrollViewport = document.getElementById('player-scroll-viewport');
    if (scrollViewport && state.playerIndex !== lastRenderedPlayerIndex) {
        scrollViewport.scrollTop = 0;
        lastRenderedPlayerIndex = state.playerIndex;
    }

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
        const transText = getLocalizedText(currentPage.translation, state.language || 'id');
        transEl.innerText = transText;
        transEl.style.display = transText ? 'block' : 'none';
    }
    if (refEl) {
        const refText = getLocalizedText(currentPage.reference, state.language || 'id');
        refEl.innerText = refText;
        refEl.style.display = refText ? 'block' : 'none';
    }

    if (counterEl) counterEl.innerText = state.playerCount;
    if (targetEl) targetEl.innerText = t('player_target_format', { target: currentPage.target });

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
    const now = Date.now();
    if (now - lastPlayerTapTime < 60) return;
    lastPlayerTapTime = now;

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
            vibrate([35, 45, 35]);
            triggerCelebration();

            // Trigger linked habits silently for individual page (micro-habit completion)
            if (currentPage.arabic) {
                const libMatch = azkarData.find(a => a.arabic && a.arabic.substring(0, 15) === currentPage.arabic.substring(0, 15));
                if (libMatch) {
                    checkAndTriggerLinkedHabit(`library-${libMatch.id}`);
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
    const textContainer = document.getElementById('player-text-container');

    if (state.playerIndex < pages.length - 1) {
        if (textContainer) {
            textContainer.style.opacity = '0';
            setTimeout(() => {
                state.playerIndex++;
                state.playerCount = 0;
                saveState();
                updatePlayerUI();
                textContainer.style.opacity = '1';
            }, 150);
        } else {
            state.playerIndex++;
            state.playerCount = 0;
            saveState();
            updatePlayerUI();
        }
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

        showModal(t('modal_celebration_title'), t('modal_celebration_msg', {name: session.name}), () => {
            showPage('page-menu');
        });
    }
}

export function confirmResetPlayer() {
    if (state.playerCount === 0 && state.playerIndex === 0) return;
    showModal(t('modal_reset_confirm_title'), t('modal_reset_confirm_msg'), () => {
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
        descSpan.textContent = t('dzikir_pages_target', {pages: item.pages.length, target: item.pages.reduce((a, c) => a + c.target, 0)});

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
        btnDel.setAttribute('aria-label', `${t('btn_delete')} ${item.name}`);
        btnDel.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>`;
        btnDel.onclick = () => {
            showModal(t('modal_delete_dzikir_title'), t('modal_delete_dzikir_msg', {name: item.name}), () => {
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
        header.innerHTML = `<span style="font-weight:700; color:var(--md-sys-color-primary);">${t('editor_page_number', {num: index + 1})}</span>`;

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

        // Normalize page.translation
        if (typeof page.translation === 'string') {
            page.translation = { id: page.translation, en: '' };
        } else if (!page.translation || typeof page.translation !== 'object') {
            page.translation = { id: '', en: '' };
        }

        const inputs = [
            { key: 'target', label: 'Target Jumlah (*)', type: 'number', val: page.target },
            { key: 'arabic', label: 'Teks Arab', type: 'text', val: page.arabic },
            { key: 'latin', label: 'Teks Latin', type: 'text', val: page.latin },
            { key: 'reference', label: 'Referensi', type: 'text', val: getLocalizedText(page.reference, state.language || 'id') }
        ];

        inputs.forEach(f => {
            const el = document.createElement('input');
            el.type = f.type;
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

        // Translation Block with Language Dropdown
        const transContainer = document.createElement('div');
        transContainer.style.cssText = 'margin-bottom: 12px; border-top: 1px dashed var(--md-sys-color-outline-variant); padding-top: 8px;';
        
        const transHeader = document.createElement('div');
        transHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;';
        
        const transLabel = document.createElement('label');
        transLabel.className = 'label-medium';
        transLabel.style.opacity = '0.8';
        transLabel.textContent = t('custom_azkar_trans_label');
        
        const transLangSelect = document.createElement('select');
        transLangSelect.style.cssText = 'background: rgba(0,0,0,0.3); border: 1px solid var(--md-sys-color-outline-variant); color: var(--md-sys-color-on-background); border-radius: 6px; padding: 2px 6px; font-size: 0.75rem;';
        transLangSelect.innerHTML = `
            <option value="id">${t('custom_azkar_trans_lang_id')}</option>
            <option value="en">${t('custom_azkar_trans_lang_en')}</option>
        `;
        transLangSelect.value = state.language || 'id';

        const transTextarea = document.createElement('textarea');
        transTextarea.placeholder = 'Terjemahan...';
        transTextarea.style.cssText = 'width: 100%; background: var(--md-sys-color-surface-container); border: none; color: var(--md-sys-color-on-background); padding: 10px; border-radius: 8px; font-family: inherit; font-size: 0.9rem; resize: vertical; min-height: 50px; box-sizing: border-box;';
        transTextarea.value = page.translation[transLangSelect.value] || '';

        transTextarea.oninput = (e) => {
            const currentLang = transLangSelect.value;
            page.translation[currentLang] = e.target.value;
        };

        transLangSelect.onchange = (e) => {
            const selectedLang = e.target.value;
            transTextarea.value = page.translation[selectedLang] || '';
        };

        transHeader.appendChild(transLabel);
        transHeader.appendChild(transLangSelect);
        transContainer.appendChild(transHeader);
        transContainer.appendChild(transTextarea);
        card.appendChild(transContainer);

        const actions = document.createElement('div');
        actions.className = 'card-actions';

        const btnDel = document.createElement('button');
        btnDel.className = 'btn btn-icon-edit';
        btnDel.style.cssText = 'background-color: rgba(255, 180, 171, 0.1); color: #ffb4ab; width: 48px; height: 48px; min-width: 48px;';
        btnDel.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"/></svg>`;
        btnDel.onclick = () => {
            if (editorSession.pages.length === 1) {
                showModal('Error', t('modal_min_1_page'), null, true);
                return;
            }
            showModal(t('modal_delete_page_title'), t('modal_delete_page_msg_index', {index: index + 1}), () => {
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
        showModal('Error', t('modal_min_1_page'), null, true);
        return;
    }
    showModal(t('modal_delete_page_title'), t('modal_delete_page_msg'), () => {
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
            showModal('Error', t('modal_dzikir_name_empty'), null, true);
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
    showModal(t('modal_success'), t('modal_saved'), () => {
        showPage('page-menu');
    }, true);
}

export function confirmRestoreGuided() {
    showModal(t('modal_reset_guided_title'), t('modal_reset_guided_msg'), () => {
        delete state.guidedData[editorType];
        saveState();
        showModal(t('modal_success'), t('modal_success_default'), () => {
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
            const zkrName = getLocalizedText(zkr.name, state.language || 'id');
            const card = document.createElement('div');
            card.style.cssText = 'background: var(--md-sys-color-surface-variant); padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s;';
            card.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 4px;">${zkrName}</div>
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
        showModal('Error', t('modal_library_load_error'), null, true);
    }
}

export function closeLibraryModal() {
    const modal = document.getElementById('library-modal');
    if (modal) modal.classList.remove('active');
}

let tempCustomTranslations = { id: '', en: '' };

export function addFromLibrary(zkr) {
    if (!editorSession) return;
    const transVal = typeof zkr.translation === 'object' && zkr.translation !== null
        ? { id: zkr.translation.id || '', en: zkr.translation.en || '' }
        : { id: zkr.translation || '', en: '' };

    editorSession.pages.push({
        id: Date.now() + Math.random(),
        arabic: zkr.arabic || '',
        latin: zkr.latin || '',
        translation: transVal,
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
        
        tempCustomTranslations = { id: '', en: '' };
        const langSelect = document.getElementById('custom-azkar-trans-lang');
        const transTextarea = document.getElementById('custom-azkar-translation');
        const activeLang = state.language || 'id';

        if (langSelect) langSelect.value = activeLang;
        if (transTextarea) {
            transTextarea.value = '';
            transTextarea.oninput = (e) => {
                const currentLang = langSelect ? langSelect.value : (state.language || 'id');
                tempCustomTranslations[currentLang] = e.target.value;
            };
        }
        if (langSelect) {
            langSelect.onchange = (e) => {
                const newLang = e.target.value;
                if (transTextarea) {
                    transTextarea.value = tempCustomTranslations[newLang] || '';
                }
            };
        }

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
    const transTextarea = document.getElementById('custom-azkar-translation');
    const langSelect = document.getElementById('custom-azkar-trans-lang');
    
    if (transTextarea && langSelect) {
        tempCustomTranslations[langSelect.value] = transTextarea.value;
    }

    if (!name) {
        showModal('Error', t('modal_azkar_name_empty'), null, true);
        return;
    }

    if (!state.customAzkar) state.customAzkar = [];
    state.customAzkar.push({ 
        name, 
        arabic, 
        latin, 
        target,
        translation: { id: tempCustomTranslations.id || '', en: tempCustomTranslations.en || '' }
    });
    saveState();
    
    closeCustomAzkarModal();
    showLibraryModal(); // Refresh the list
}

let lastDeletedCustomAzkar = null;

export function deleteCustomAzkar(index) {
    if (state.customAzkar && state.customAzkar[index]) {
        lastDeletedCustomAzkar = { item: state.customAzkar[index], index };
        state.customAzkar.splice(index, 1);
        saveState();
        showLibraryModal(); // Refresh the list
        showToast(t('modal_azkar_deleted') || 'Azkar dihapus', t('btn_undo') || 'Undo', () => {
            undoDeleteCustomAzkar();
        });
    }
}

export function undoDeleteCustomAzkar() {
    if (lastDeletedCustomAzkar && lastDeletedCustomAzkar.item) {
        if (!state.customAzkar) state.customAzkar = [];
        state.customAzkar.splice(lastDeletedCustomAzkar.index, 0, lastDeletedCustomAzkar.item);
        saveState();
        showLibraryModal();
        lastDeletedCustomAzkar = null;
    }
}

export function filterLibrary(query) {
    const listContainer = document.getElementById('library-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    const lowerQuery = query.toLowerCase().trim();
    
    // Filter default presets
    const filteredPresets = azkarData.filter(zkr => {
        const zkrName = getLocalizedText(zkr.name, state.language || 'id');
        return (zkrName && zkrName.toLowerCase().includes(lowerQuery)) ||
            (zkr.arabic && zkr.arabic.toLowerCase().includes(lowerQuery)) ||
            (zkr.latin && zkr.latin.toLowerCase().includes(lowerQuery));
    });
    
    filteredPresets.forEach(zkr => {
        const zkrName = getLocalizedText(zkr.name, state.language || 'id');
        const card = document.createElement('div');
        card.style.cssText = 'background: var(--md-sys-color-surface-variant); padding: 12px; border-radius: 8px; cursor: pointer; transition: background 0.2s;';
        card.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">${zkrName}</div>
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

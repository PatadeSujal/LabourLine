import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import as_ from './locals/as.json';
import en from './locals/en.json';
import hi from './locals/hi.json';
import kn from './locals/kn.json';
import ml from './locals/ml.json';
import mr from './locals/mr.json';
import pa from './locals/pa.json';
import ta from './locals/ta.json';
import te from './locals/te.json';
import ur from './locals/ur.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
      ml: { translation: ml },
      pa: { translation: pa },
      ta: { translation: ta },
      te: { translation: te },
      kn: { translation: kn },
      as: { translation: as_ },
      ur: { translation: ur },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;


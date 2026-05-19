import i18n from "i18next";

import {
  initReactI18next
} from "react-i18next";

i18n.use(
  initReactI18next
).init({

  lng: "fa",

  fallbackLng: "en",

  resources: {

    fa: {
      translation: {
        welcome: "خوش آمدید",
      },
    },

    en: {
      translation: {
        welcome: "Welcome",
      },
    },

  },

});

export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '@renderer/locales/en/common.json';
import enNavigation from '@renderer/locales/en/navigation.json';
import enPages from '@renderer/locales/en/pages.json';
import enSettings from '@renderer/locales/en/settings.json';
import enChat from '@renderer/locales/en/chat.json';
import enCourses from '@renderer/locales/en/courses.json';
import enNotes from '@renderer/locales/en/notes.json';
import enOnboarding from '@renderer/locales/en/onboarding.json';
import enShortcuts from '@renderer/locales/en/shortcuts.json';
import trCommon from '@renderer/locales/tr/common.json';
import trNavigation from '@renderer/locales/tr/navigation.json';
import trPages from '@renderer/locales/tr/pages.json';
import trSettings from '@renderer/locales/tr/settings.json';
import trChat from '@renderer/locales/tr/chat.json';
import trCourses from '@renderer/locales/tr/courses.json';
import trNotes from '@renderer/locales/tr/notes.json';
import trOnboarding from '@renderer/locales/tr/onboarding.json';
import trShortcuts from '@renderer/locales/tr/shortcuts.json';

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      navigation: enNavigation,
      pages: enPages,
      settings: enSettings,
      chat: enChat,
      courses: enCourses,
      notes: enNotes,
      onboarding: enOnboarding,
      shortcuts: enShortcuts,
    },
    tr: {
      common: trCommon,
      navigation: trNavigation,
      pages: trPages,
      settings: trSettings,
      chat: trChat,
      courses: trCourses,
      notes: trNotes,
      onboarding: trOnboarding,
      shortcuts: trShortcuts,
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: [
    'common',
    'navigation',
    'pages',
    'settings',
    'chat',
    'courses',
    'notes',
    'onboarding',
    'shortcuts',
  ],
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

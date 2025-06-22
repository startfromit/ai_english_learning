'use client';

import { useTranslation } from 'react-i18next';

export default function LocaleSwitcher() {
  const { i18n } = useTranslation();

  const switchLocale = () => {
    const newLang = i18n.language.startsWith('en') ? 'zh' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={switchLocale}
      className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors mr-2"
      title={i18n.language.startsWith('en') ? '切换到中文' : 'Switch to English'}
    >
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    </button>
  );
} 
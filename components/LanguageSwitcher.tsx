
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    const buttonStyle = "px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200";
    const activeStyle = "bg-sky-500 text-white shadow-md";
    const inactiveStyle = "bg-slate-700 text-slate-300 hover:bg-slate-600";

    return (
        <div className="flex items-center space-x-2 p-1 bg-slate-800 rounded-lg">
            <button
                onClick={() => setLanguage('en')}
                className={`${buttonStyle} ${language === 'en' ? activeStyle : inactiveStyle}`}
                aria-pressed={language === 'en'}
            >
                EN
            </button>
            <button
                onClick={() => setLanguage('es')}
                className={`${buttonStyle} ${language === 'es' ? activeStyle : inactiveStyle}`}
                aria-pressed={language === 'es'}
            >
                ES
            </button>
        </div>
    );
};

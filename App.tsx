import React, { useState, useEffect, useCallback } from 'react';
import { TripForm } from './components/TripForm';
import { ItineraryDisplay } from './components/ItineraryDisplay';
import { generateItinerary } from './services/geminiService';
import type { TripPreferences, Itinerary, City } from './types';
import { ExclamationTriangleIcon } from './components/IconComponents';
import { useLanguage } from './context/LanguageContext';
import { useTranslations } from './hooks/useTranslations';
import { LanguageSwitcher } from './components/LanguageSwitcher';

const App: React.FC = () => {
  const [preferences, setPreferences] = useState<TripPreferences>({
    destination: '',
    duration: 7,
    budget: '',
    interests: [],
    restrictions: '',
    otherInterest: '',
  });
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{lat: number, lon: number} | null>(null);
  const { language } = useLanguage();
  const t = useTranslations();
  
  const [cities, setCities] = useState<City[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [citiesError, setCitiesError] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude
        });
      },
      (err) => {
        console.warn(`Could not get user location: ${err.message}`);
      }
    );
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      setIsLoadingCities(true);
      setCitiesError(false);
      try {
        // Use dynamic import to lazy-load the large cities file
        const { CITIES } = await import('./data/cities');
        setCities(CITIES);
      } catch (err) {
        console.error("Fatal error: Could not load local cities data.", err);
        setCitiesError(true);
      } finally {
        setIsLoadingCities(false);
      }
    };
    loadCities();
  }, []);


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setItinerary(null);

    const preferencesForApi = { ...preferences };
    const otherInterestKey = language === 'es' ? 'Otros' : 'Other';

    if (preferencesForApi.interests.includes(otherInterestKey)) {
        preferencesForApi.interests = preferencesForApi.interests.filter(i => i !== otherInterestKey);
        if (preferencesForApi.otherInterest && preferencesForApi.otherInterest.trim() !== '') {
            preferencesForApi.interests.push(preferencesForApi.otherInterest.trim());
        }
    }

    try {
      const result = await generateItinerary(preferencesForApi, language);
      setItinerary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.app.error);
    } finally {
      setIsLoading(false);
    }
  }, [preferences, language, t]);

  const handleReset = () => {
    setItinerary(null);
    setError(null);
    setPreferences({
        destination: '',
        duration: 7,
        budget: '',
        interests: [],
        restrictions: '',
        otherInterest: '',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-4 sm:p-8 flex flex-col items-center">
      <header className="w-full text-center mb-8 animate-fade-in flex flex-col items-center gap-4">
        <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
            {t.app.title}
            </h1>
            <p className="mt-3 text-lg text-slate-300 max-w-2xl mx-auto">
            {t.app.subtitle}
            </p>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="w-full">
        {error && (
          <div className="w-full max-w-2xl mx-auto mb-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg flex items-center animate-fade-in">
            <ExclamationTriangleIcon />
            <span className="ml-3">{error}</span>
          </div>
        )}
        {citiesError && (
          <div className="w-full max-w-2xl mx-auto mb-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg flex items-center animate-fade-in">
            <ExclamationTriangleIcon />
            <span className="ml-3">{t.app.citiesError}</span>
          </div>
        )}

        {!itinerary ? (
          <TripForm
            preferences={preferences}
            setPreferences={setPreferences}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            cities={cities}
            isLoadingCities={isLoadingCities}
          />
        ) : (
          <ItineraryDisplay 
            itineraryData={itinerary} 
            destination={preferences.destination} 
            onReset={handleReset}
            userCoords={userCoords}
            language={language}
           />
        )}
      </main>
      
      <footer className="text-center mt-12 text-slate-500 text-sm">
        <p>{t.app.footer}</p>
      </footer>
    </div>
  );
};

export default App;
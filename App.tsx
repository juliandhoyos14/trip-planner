import React, { useState, useEffect, useCallback } from 'react';
import { TripForm } from './components/TripForm';
import { ItineraryDisplay } from './components/ItineraryDisplay';
import { generateItinerary } from './services/geminiService';
import type { TripPreferences, Itinerary } from './types';
import { SparklesIcon, ExclamationTriangleIcon } from './components/IconComponents';

const App: React.FC = () => {
  const [preferences, setPreferences] = useState<TripPreferences>({
    destination: '',
    duration: 7,
    budget: '',
    interests: [],
    restrictions: '',
  });
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{lat: number, lon: number} | null>(null);

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


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setItinerary(null);

    try {
      const result = await generateItinerary(preferences);
      setItinerary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);

  const handleReset = () => {
    setItinerary(null);
    setError(null);
    setPreferences({
        destination: '',
        duration: 7,
        budget: '',
        interests: [],
        restrictions: '',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-4 sm:p-8 flex flex-col items-center">
      <header className="text-center mb-8 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
          Planificador de Viajes IA Pro
        </h1>
        <p className="mt-3 text-lg text-slate-300 max-w-2xl mx-auto">
          Crea tu viaje perfecto. Solo comparte tus sueños de viaje, y nuestra IA se encargará de los detalles.
        </p>
      </header>

      <main className="w-full">
        {error && (
          <div className="w-full max-w-2xl mx-auto mb-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg flex items-center animate-fade-in">
            <ExclamationTriangleIcon />
            <span className="ml-3">{error}</span>
          </div>
        )}

        {!itinerary ? (
          <TripForm
            preferences={preferences}
            setPreferences={setPreferences}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        ) : (
          <ItineraryDisplay 
            itineraryData={itinerary} 
            destination={preferences.destination} 
            onReset={handleReset}
            userCoords={userCoords}
           />
        )}
      </main>
      
      <footer className="text-center mt-12 text-slate-500 text-sm">
        <p>Desarrollado con Google Gemini. El viaje de tus sueños está a solo un prompt de distancia.</p>
      </footer>
    </div>
  );
};

export default App;
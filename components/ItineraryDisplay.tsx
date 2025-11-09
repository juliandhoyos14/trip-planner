import React, { useState, useCallback } from 'react';
import type { Itinerary, Activity, GroundingChunk } from '../types';
import { CheckCircleIcon, LightBulbIcon, PrinterIcon, ClipboardIcon, ExclamationTriangleIcon } from './IconComponents';
import { getLocationInfo } from '../services/geminiService';

const ActivityCard: React.FC<{ activity: Activity, destination: string, userCoords: {lat: number, lon: number} | null }> = ({ activity, destination, userCoords }) => {
  const [info, setInfo] = useState<string | null>(null);
  const [chunks, setChunks] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocationInfo = useCallback(async () => {
    if (info) { // Toggle off
        setInfo(null);
        setChunks([]);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const result = await getLocationInfo(activity.location.name, destination, userCoords);
        setInfo(result.text);
        setChunks(result.chunks);
    } catch (err) {
        setError('No se pudieron obtener los detalles. Por favor, inténtalo de nuevo.');
    } finally {
        setIsLoading(false);
    }
  }, [activity.location.name, destination, info, userCoords]);

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 transition-shadow hover:shadow-lg hover:border-slate-600">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-sky-400">{activity.time}</p>
          <p className="text-lg font-bold text-white mt-1">{activity.location.name}</p>
        </div>
        <p className="text-sm font-medium bg-slate-700 text-sky-300 px-2 py-1 rounded-md">{activity.estimatedCost}</p>
      </div>
      <p className="mt-2 text-slate-300">{activity.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${activity.location.latitude},${activity.location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm bg-slate-700 hover:bg-slate-600 text-white font-medium py-1 px-3 rounded-full transition-colors"
        >
          Ver en el Mapa
        </a>
        <button
          onClick={fetchLocationInfo}
          disabled={isLoading}
          className="text-sm bg-slate-700 hover:bg-slate-600 text-white font-medium py-1 px-3 rounded-full transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Cargando...' : (info ? 'Ocultar Info' : 'Más Info')}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      {info && (
          <div className="mt-4 p-4 bg-slate-900 rounded-md border border-slate-700 text-slate-300 text-sm space-y-3">
              <h4 className="font-bold text-white">Información Actualizada de {activity.location.name}</h4>
              <p style={{whiteSpace: 'pre-wrap'}}>{info}</p>
              {chunks.length > 0 && (
                  <div>
                      <h5 className="font-semibold text-slate-200 mt-3 mb-2">Fuentes:</h5>
                      <ul className="list-disc list-inside space-y-1">
                          {chunks.map((chunk, index) => (
                              <li key={index}>
                                  {chunk.web && <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{chunk.web.title || 'Enlace Web'}</a>}
                                  {chunk.maps && <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{chunk.maps.title || 'Enlace del Mapa'}</a>}
                              </li>
                          ))}
                      </ul>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};


export const ItineraryDisplay: React.FC<{ itineraryData: Itinerary, destination: string, onReset: () => void, userCoords: {lat: number, lon: number} | null }> = ({ itineraryData, destination, onReset, userCoords }) => {
  const { itinerary, justification } = itineraryData;
  const [copyStatus, setCopyStatus] = useState('');

  const handlePrint = () => {
    window.print();
  };
  
  const handleCopyToClipboard = () => {
    let csvContent = "Día,Hora,Actividad,Costo,Ubicación\n";
    itinerary.forEach(dayPlan => {
        dayPlan.activities.forEach(activity => {
            const row = [
                dayPlan.day,
                `"${activity.time}"`,
                `"${activity.description.replace(/"/g, '""')}"`,
                `"${activity.estimatedCost}"`,
                `"${activity.location.name}"`
            ].join(',');
            csvContent += row + "\n";
        });
    });
    navigator.clipboard.writeText(csvContent).then(() => {
        setCopyStatus('¡Copiado al portapapeles!');
        setTimeout(() => setCopyStatus(''), 2000);
    }, () => {
        setCopyStatus('Error al copiar.');
        setTimeout(() => setCopyStatus(''), 2000);
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">Tu Itinerario Personalizado para <span className="text-sky-400">{destination}</span></h1>
            <p className="mt-4 text-lg text-slate-300">Aquí tienes tu plan de viaje personalizado generado por IA. ¡Disfruta de tu aventura!</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center"><LightBulbIcon /> Justificación de la IA</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-sky-400 mb-1">Intereses</h3>
                    <p className="text-slate-300">{justification.interestsAlignment}</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-sky-400 mb-1">Presupuesto</h3>
                    <p className="text-slate-300">{justification.budgetAlignment}</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-sky-400 mb-1">Requisitos</h3>
                    <p className="text-slate-300">{justification.restrictionsAlignment}</p>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            {itinerary.map((dayPlan) => (
                <div key={dayPlan.day} className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                    <div className="bg-slate-700/50 px-6 py-4">
                        <h3 className="text-xl font-bold text-white">Día {dayPlan.day}: <span className="font-medium text-slate-200">{dayPlan.title}</span></h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {dayPlan.activities.map((activity, index) => (
                            <ActivityCard key={index} activity={activity} destination={destination} userCoords={userCoords} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button
                onClick={handlePrint}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
                <PrinterIcon /> Imprimir / Guardar como PDF
            </button>
            <button
                onClick={handleCopyToClipboard}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
                <ClipboardIcon /> {copyStatus || 'Copiar como CSV'}
            </button>
             <button
                onClick={onReset}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-2 border border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-300 bg-slate-700 hover:bg-slate-600"
            >
                Crear un Nuevo Plan
            </button>
        </div>
    </div>
  );
};
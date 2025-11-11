import React, { useState, useCallback } from 'react';
import type { Itinerary, Activity, GroundingChunk, Language } from '../types';
import { CheckCircleIcon, LightBulbIcon, PrinterIcon, ClipboardIcon, ExclamationTriangleIcon } from './IconComponents';
import { getLocationInfo } from '../services/geminiService';
import { useTranslations } from '../hooks/useTranslations';

const ActivityCard: React.FC<{ activity: Activity, destination: string, userCoords: {lat: number, lon: number} | null, language: Language }> = ({ activity, destination, userCoords, language }) => {
  const [info, setInfo] = useState<string | null>(null);
  const [chunks, setChunks] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations();

  const fetchLocationInfo = useCallback(async () => {
    if (info) { // Toggle off
        setInfo(null);
        setChunks([]);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const result = await getLocationInfo(activity.location.name, destination, userCoords, language);
        setInfo(result.text);
        setChunks(result.chunks);
    } catch (err) {
        setError(t.itinerary.fetchError);
    } finally {
        setIsLoading(false);
    }
  }, [activity.location.name, destination, info, userCoords, language, t]);

  return (
    <div className="activity-card bg-slate-800 p-4 rounded-lg border border-slate-700 transition-shadow hover:shadow-lg hover:border-slate-600">
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
          {t.itinerary.viewOnMap}
        </a>
        <button
          onClick={fetchLocationInfo}
          disabled={isLoading}
          className="text-sm bg-slate-700 hover:bg-slate-600 text-white font-medium py-1 px-3 rounded-full transition-colors disabled:opacity-50"
        >
          {isLoading ? t.itinerary.loading : (info ? t.itinerary.hideInfo : t.itinerary.moreInfo)}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      {info && (
          <div className="mt-4 p-4 bg-slate-900 rounded-md border border-slate-700 text-slate-300 text-sm space-y-3">
              <h4 className="font-bold text-white">{t.itinerary.updatedInfo} {activity.location.name}</h4>
              <p style={{whiteSpace: 'pre-wrap'}}>{info}</p>
              {chunks.length > 0 && (
                  <div>
                      <h5 className="font-semibold text-slate-200 mt-3 mb-2">{t.itinerary.sources}</h5>
                      <ul className="list-disc list-inside space-y-1">
                          {chunks.map((chunk, index) => (
                              <li key={index}>
                                  {chunk.web && <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{chunk.web.title || t.itinerary.webLink}</a>}
                                  {chunk.maps && <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{chunk.maps.title || t.itinerary.mapLink}</a>}
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


export const ItineraryDisplay: React.FC<{ itineraryData: Itinerary, destination: string, onReset: () => void, userCoords: {lat: number, lon: number} | null, language: Language }> = ({ itineraryData, destination, onReset, userCoords, language }) => {
  const { itinerary, justification } = itineraryData;
  const [copyStatus, setCopyStatus] = useState('');
  const t = useTranslations();

  const handlePrint = () => {
    const printableArea = document.getElementById('printable-area');
    if (!printableArea) {
      console.error('Printable area not found!');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert(t.itinerary.popupBlocker);
      return;
    }

    const originalHTML = printableArea.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${t.itinerary.printTitle}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            .day-plan-card, .activity-card {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body class="bg-slate-900 text-white p-8">
          ${originalHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } catch (e) {
        console.error("Could not print content", e);
        alert(t.itinerary.printError);
      }
    }, 500);
  };
  
  const handleCopyToClipboard = () => {
    let csvContent = "Day,Time,Activity,Cost,Location\n";
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
        setCopyStatus(t.itinerary.copySuccess);
        setTimeout(() => setCopyStatus(''), 2000);
    }, () => {
        setCopyStatus(t.itinerary.copyError);
        setTimeout(() => setCopyStatus(''), 2000);
    });
  };

  return (
    <div id="printable-area" className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">{t.itinerary.title} <span className="text-sky-400">{destination}</span></h1>
            <p className="mt-4 text-lg text-slate-300">{t.itinerary.subtitle}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 space-y-4">
            <h2 className="text-2xl font-bold text-white flex items-center"><LightBulbIcon /> {t.itinerary.justificationTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-sky-400 mb-1">{t.itinerary.interests}</h3>
                    <p className="text-slate-300">{justification.interestsAlignment}</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-sky-400 mb-1">{t.itinerary.budget}</h3>
                    <p className="text-slate-300">{justification.budgetAlignment}</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-sky-400 mb-1">{t.itinerary.requirements}</h3>
                    <p className="text-slate-300">{justification.restrictionsAlignment}</p>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            {itinerary.map((dayPlan) => (
                <div key={dayPlan.day} className="day-plan-card bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                    <div className="bg-slate-700/50 px-6 py-4">
                        <h3 className="text-xl font-bold text-white">{t.itinerary.day} {dayPlan.day}: <span className="font-medium text-slate-200">{dayPlan.title}</span></h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {dayPlan.activities.map((activity, index) => (
                            <ActivityCard key={index} activity={activity} destination={destination} userCoords={userCoords} language={language} />
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
                <PrinterIcon /> {t.itinerary.printButton}
            </button>
            <button
                onClick={handleCopyToClipboard}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
            >
                <ClipboardIcon /> {copyStatus || t.itinerary.copyButton}
            </button>
             <button
                onClick={onReset}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-2 border border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-300 bg-slate-700 hover:bg-slate-600"
            >
                {t.itinerary.newPlanButton}
            </button>
        </div>
    </div>
  );
};
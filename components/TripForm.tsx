import React from 'react';
import type { TripPreferences } from '../types';
import { INTEREST_OPTIONS } from '../constants';
import { GlobeIcon, CalendarDaysIcon, CurrencyDollarIcon, SparklesIcon } from './IconComponents';

interface TripFormProps {
  preferences: TripPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<TripPreferences>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const InputField: React.FC<{
  id: string;
  label: string;
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: React.ReactNode;
  min?: number;
}> = ({ id, label, type, value, onChange, placeholder, icon, min }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
      {label}
    </label>
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <span className="text-slate-400">{icon}</span>
      </div>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        className="block w-full rounded-md border-0 bg-slate-700 py-2.5 pl-10 pr-3 text-white ring-1 ring-inset ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm"
        required
      />
    </div>
  </div>
);

export const TripForm: React.FC<TripFormProps> = ({ preferences, setPreferences, onSubmit, isLoading }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setPreferences((prev) => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={onSubmit} className="space-y-6 bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <InputField
            id="destination"
            label="Destino"
            type="text"
            value={preferences.destination}
            onChange={handleInputChange}
            placeholder="Ej: Tokio, Japón"
            icon={<GlobeIcon />}
          />
          <InputField
            id="duration"
            label="Duración (días)"
            type="number"
            value={preferences.duration}
            onChange={handleInputChange}
            placeholder="Ej: 7"
            icon={<CalendarDaysIcon />}
            min={1}
          />
        </div>
        <InputField
          id="budget"
          label="Presupuesto Estimado"
          type="text"
          value={preferences.budget}
          onChange={handleInputChange}
          placeholder="Ej: $2000 USD por persona"
          icon={<CurrencyDollarIcon />}
        />
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Intereses Clave
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <button
                type="button"
                key={interest}
                onClick={() => handleInterestToggle(interest)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors duration-200 ${
                  preferences.interests.includes(interest)
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="restrictions" className="block text-sm font-medium text-slate-300 mb-1">
            Requisitos / Restricciones Específicas
          </label>
          <textarea
            id="restrictions"
            name="restrictions"
            rows={3}
            value={preferences.restrictions}
            onChange={handleInputChange}
            placeholder="Ej: Familia con niños pequeños, necesidades de accesibilidad, preferencia por comida vegetariana..."
            className="block w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-white ring-1 ring-inset ring-slate-600 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando Tu Aventura...
              </>
            ) : (
                <>
                <SparklesIcon /> <span className="ml-2">Generar Plan de Viaje</span>
                </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
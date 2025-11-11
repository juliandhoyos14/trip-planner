import React, { useState } from 'react';
import type { TripPreferences, City } from '../types';
import { INTEREST_OPTIONS } from '../constants';
import { GlobeIcon, CalendarDaysIcon, CurrencyDollarIcon, SparklesIcon } from './IconComponents';
import { useLanguage } from '../context/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';
import { AutocompleteInput } from './AutocompleteInput';

interface TripFormProps {
  preferences: TripPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<TripPreferences>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  cities: City[];
  isLoadingCities: boolean;
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
  error?: string;
}> = ({ id, label, type, value, onChange, placeholder, icon, min, error }) => (
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
        className={`block w-full rounded-md border-0 bg-slate-700 py-2.5 pl-10 pr-3 text-white ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm ${
            error
            ? 'ring-red-500/80 focus:ring-red-500'
            : 'ring-slate-600 focus:ring-sky-500'
        }`}
        required
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </div>
    {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-400">{error}</p>}
  </div>
);

export const TripForm: React.FC<TripFormProps> = ({ preferences, setPreferences, onSubmit, isLoading, cities, isLoadingCities }) => {
  const { language } = useLanguage();
  const t = useTranslations();
  const [errors, setErrors] = useState<Partial<Record<keyof TripPreferences | 'otherInterest', string>>>({});

  const otherInterestKey = language === 'es' ? 'Otros' : 'Other';

  const validate = (): boolean => {
      const newErrors: Partial<Record<keyof TripPreferences | 'otherInterest', string>> = {};

      if (!preferences.destination.trim()) {
          newErrors.destination = t.form.validation.required;
      }
      if (!preferences.duration || preferences.duration <= 0) {
          newErrors.duration = t.form.validation.positiveNumber;
      }

      const budgetValue = parseFloat(preferences.budget);
      if (!preferences.budget.trim()) {
          newErrors.budget = t.form.validation.required;
      } else if (isNaN(budgetValue) || budgetValue <= 10) {
          newErrors.budget = t.form.validation.budgetMin;
      }

      if (preferences.interests.includes(otherInterestKey) && (!preferences.otherInterest || !preferences.otherInterest.trim())) {
          newErrors.otherInterest = t.form.validation.required;
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value, 10) || '' : value,
    }));
  };

  const handleDestinationChange = (value: string) => {
    setPreferences((prev) => ({
        ...prev,
        destination: value,
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

  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (validate()) {
          onSubmit(e);
      }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleFormSubmit} className="space-y-6 bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <AutocompleteInput
            id="destination"
            label={t.form.destination}
            value={preferences.destination}
            onChange={handleDestinationChange}
            placeholder={isLoadingCities ? t.form.destinationLoadingPlaceholder : t.form.destinationPlaceholder}
            icon={<GlobeIcon />}
            error={errors.destination}
            cities={cities}
            disabled={isLoadingCities}
          />
          <InputField
            id="duration"
            label={t.form.duration}
            type="number"
            value={preferences.duration}
            onChange={handleInputChange}
            placeholder={t.form.durationPlaceholder}
            icon={<CalendarDaysIcon />}
            min={1}
            error={errors.duration}
          />
        </div>
        <div>
            <InputField
              id="budget"
              label={t.form.budget}
              type="text"
              value={preferences.budget}
              onChange={handleInputChange}
              placeholder={t.form.budgetPlaceholder}
              icon={<CurrencyDollarIcon />}
              error={errors.budget}
            />
            <p className="mt-1 text-xs text-slate-400">{t.form.budgetPerPerson}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t.form.interests}
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS[language].map((interest) => (
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
           {preferences.interests.includes(otherInterestKey) && (
            <div className="mt-4">
              <label htmlFor="otherInterest" className="sr-only">{otherInterestKey}</label>
              <input
                  type="text"
                  id="otherInterest"
                  name="otherInterest"
                  value={preferences.otherInterest || ''}
                  onChange={handleInputChange}
                  placeholder={t.form.otherInterestPlaceholder}
                  className={`block w-full rounded-md border-0 bg-slate-700 py-2 px-3 text-white ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm ${
                      errors.otherInterest
                      ? 'ring-red-500/80 focus:ring-red-500'
                      : 'ring-slate-600 focus:ring-sky-500'
                  }`}
                  aria-invalid={!!errors.otherInterest}
                  aria-describedby={errors.otherInterest ? `otherInterest-error` : undefined}
              />
              {errors.otherInterest && <p id="otherInterest-error" className="mt-1 text-sm text-red-400">{errors.otherInterest}</p>}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="restrictions" className="block text-sm font-medium text-slate-300 mb-1">
            {t.form.requirements}
          </label>
          <textarea
            id="restrictions"
            name="restrictions"
            rows={3}
            value={preferences.restrictions}
            onChange={handleInputChange}
            placeholder={t.form.requirementsPlaceholder}
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
                {t.form.loadingButton}
              </>
            ) : (
                <>
                <SparklesIcon /> <span className="ml-2">{t.form.submitButton}</span>
                </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
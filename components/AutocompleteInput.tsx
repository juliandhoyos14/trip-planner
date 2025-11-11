import React, { useState, useEffect, useRef } from 'react';
import type { City } from '../types';

interface AutocompleteInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
  cities: City[];
  disabled?: boolean;
}

const formatCity = (city: City): string => {
    return `${city.name}, ${city.subcountry ? city.subcountry + ', ' : ''}${city.country}`;
};

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  icon,
  error,
  cities,
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onChange(query);

    if (query.length > 1 && cities.length > 0) {
      const filteredSuggestions = cities
        .map(formatCity)
        .filter(cityName => cityName.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 7); // Limit suggestions to a reasonable number
      
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
      setActiveSuggestionIndex(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSuggestionClick(suggestions[activeSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="text-slate-400">{icon}</span>
        </div>
        <input
          type="text"
          id={id}
          name={id}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`block w-full rounded-md border-0 bg-slate-700 py-2.5 pl-10 pr-3 text-white ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? 'ring-red-500/80 focus:ring-red-500'
              : 'ring-slate-600 focus:ring-sky-500'
          }`}
          autoComplete="off"
          required
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-autocomplete="list"
          aria-controls="autocomplete-list"
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul
            id="autocomplete-list"
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-slate-600"
          >
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`relative cursor-default select-none py-2 px-4 text-slate-200 ${
                  index === activeSuggestionIndex ? 'bg-slate-600' : ''
                }`}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
};
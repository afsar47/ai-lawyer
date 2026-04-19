'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronDown, Briefcase } from 'lucide-react';

export interface CaseOption {
  _id: string;
  caseNumber: string;
  title: string;
  clientName: string;
  clientId?: string;
}

interface CaseSearchSelectProps {
  value: string;
  onChange: (id: string, caseData: CaseOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  className?: string;
}

export default function CaseSearchSelect({
  value,
  onChange,
  placeholder = 'Search cases...',
  disabled = false,
  required = false,
  label,
  className = '',
}: CaseSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState<CaseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCases = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (query.trim()) {
        params.set('q', query.trim());
      }
      const res = await fetch(`/api/cases?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const cases = Array.isArray(data) ? data : data.data || [];
        setOptions(cases);
      }
    } catch (err) {
      console.error('Failed to fetch cases:', err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (value && !selectedCase) {
      const fetchSelected = async () => {
        try {
          const res = await fetch(`/api/cases/${value}`);
          if (res.ok) {
            const caseData = await res.json();
            setSelectedCase(caseData);
          }
        } catch (err) {
          console.error('Failed to fetch selected case:', err);
        }
      };
      fetchSelected();
    }
  }, [value, selectedCase]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchCases(searchTerm);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, fetchCases]);

  useEffect(() => {
    if (isOpen) {
      fetchCases(searchTerm);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (caseOption: CaseOption) => {
    setSelectedCase(caseOption);
    onChange(caseOption._id, caseOption);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCase(null);
    onChange('', null);
    setSearchTerm('');
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div
        onClick={handleOpen}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer
          flex items-center justify-between gap-2
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        {selectedCase ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="truncate text-sm">
              {selectedCase.caseNumber}: {selectedCase.title} — {selectedCase.clientName}
            </span>
          </div>
        ) : (
          <span className="text-gray-500 text-sm">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedCase && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type to search cases..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                <span className="mt-2 block">Searching...</span>
              </div>
            ) : options.length > 0 ? (
              <ul>
                {options.map((caseOption) => (
                  <li
                    key={caseOption._id}
                    onClick={() => handleSelect(caseOption)}
                    className={`
                      px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm
                      ${value === caseOption._id ? 'bg-blue-100' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {caseOption.caseNumber}: {caseOption.title}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {caseOption.clientName}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchTerm ? 'No cases found' : 'Start typing to search'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

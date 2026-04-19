'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  role?: string;
  qualifications?: string[];
  specialization?: string;
  department?: string;
}

interface SearchableDoctorSelectProps {
  value: string;
  onChange: (doctor: Doctor | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function SearchableDoctorSelect({
  value,
  onChange,
  placeholder = "Search and select a doctor...",
  className = "",
  disabled = false
}: SearchableDoctorSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load doctors when component mounts
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Sync searchTerm and selectedDoctor with value prop when doctors are loaded
  useEffect(() => {
    if (doctors.length > 0 && value) {
      if (value !== searchTerm) {
        setSearchTerm(value);
        // Try to find the doctor in the list
        const doctor = doctors.find(d => d.name === value);
        if (doctor) {
          setSelectedDoctor(doctor);
        } else if (value) {
          // If doctor not found in list but value exists, create a placeholder
          const placeholderDoctor: Doctor = {
            _id: '',
            name: value,
            email: '',
            role: 'doctor'
          };
          setSelectedDoctor(placeholderDoctor);
        }
      }
    } else if (!value && searchTerm && !selectedDoctor) {
      setSearchTerm('');
      setSelectedDoctor(null);
    }
  }, [value, doctors]);

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        filterDoctors(searchTerm);
      } else {
        fetchDoctors();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/lawyers');
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const filtered = doctors.filter((doctor) =>
      doctor.name.toLowerCase().includes(lowerQuery) ||
      doctor.email.toLowerCase().includes(lowerQuery)
    );
    // We'll use the filtered list in the dropdown
    // For now, we keep all doctors and filter in the display
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setIsOpen(true);
    setHighlightedIndex(-1);
    
    // If search term is cleared, clear selection
    if (!newSearchTerm.trim()) {
      setSelectedDoctor(null);
      onChange(null);
    }
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSearchTerm(doctor.name);
    setIsOpen(false);
    onChange(doctor);
  };

  const handleClear = () => {
    if (disabled) return;
    setSelectedDoctor(null);
    setSearchTerm('');
    onChange(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    const filteredDoctors = getFilteredDoctors();

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredDoctors.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredDoctors[highlightedIndex]) {
          handleDoctorSelect(filteredDoctors[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const getFilteredDoctors = () => {
    if (!searchTerm.trim()) {
      return doctors;
    }
    const lowerQuery = searchTerm.toLowerCase();
    return doctors.filter((doctor) =>
      doctor.name.toLowerCase().includes(lowerQuery) ||
      doctor.email.toLowerCase().includes(lowerQuery)
    );
  };

  const filteredDoctors = getFilteredDoctors();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled ? 'bg-gray-50 text-gray-600 cursor-not-allowed' : ''
          }`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {selectedDoctor && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {!disabled && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
              <span className="ml-2">Loading...</span>
            </div>
          ) : filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor, index) => (
              <div
                key={doctor._id}
                onClick={() => handleDoctorSelect(doctor)}
                className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  index === highlightedIndex
                    ? 'bg-blue-50 text-blue-900'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{doctor.name}</div>
                    <div className="text-sm text-gray-500">
                      {doctor.email}
                    </div>
                  </div>
                  {doctor.role && (
                    <div className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                      {doctor.role}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : searchTerm.trim() ? (
            <div className="p-3 text-center text-gray-500">
              No doctors found for "{searchTerm}"
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500">
              Start typing to search doctors...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

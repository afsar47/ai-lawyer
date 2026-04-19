'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface Client {
  _id: string;
  clientNumber?: string;
  name: string;
  email?: string;
  phone?: string;
  type?: 'individual' | 'organization';
}

interface SearchableClientSelectProps {
  value: string;
  onChange: (client: Client | null) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableClientSelect({
  value,
  onChange,
  placeholder = 'Search and select a client...',
  className = '',
}: SearchableClientSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchClients(searchTerm);
    }, 250);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    searchClients('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchClients = async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients?q=${encodeURIComponent(query)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setClients(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);

    if (!newValue.trim()) {
      setSelectedClient(null);
      onChange(null);
    }
  };

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setSearchTerm(client.name);
    setIsOpen(false);
    onChange(client);
  };

  const handleClear = () => {
    setSelectedClient(null);
    setSearchTerm('');
    onChange(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < clients.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && clients[highlightedIndex]) {
          handleClientSelect(clients[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm || value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {selectedClient && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 mr-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
              <span className="ml-2">Searching...</span>
            </div>
          ) : clients.length > 0 ? (
            clients.map((client, index) => (
              <div
                key={client._id}
                onClick={() => handleClientSelect(client)}
                className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  index === highlightedIndex ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500">
                      {client.clientNumber ? `ID: ${client.clientNumber} • ` : ''}
                      {client.email || '—'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">{client.phone || '—'}</div>
                </div>
              </div>
            ))
          ) : searchTerm.trim() ? (
            <div className="p-3 text-center text-gray-500">No clients found for "{searchTerm}"</div>
          ) : (
            <div className="p-3 text-center text-gray-500">Start typing to search clients...</div>
          )}
        </div>
      )}
    </div>
  );
}


'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Search, AlertCircle } from 'lucide-react';

interface MedicineSearchResult {
  brand_id?: string;
  generic_id?: string;
  brand_name?: string;
  generic_name: string;
  dosage_form?: string;
  dosage_form_id?: string;
  strength?: string;
  strength_id?: string;
  route?: string;
  route_id?: string;
  match_score: number;
  rank_weight: number;
}

interface DrugSearchUIProps {
  onSelect: (medicine: MedicineSearchResult) => void;
}

export default function DrugSearchUI({ onSelect }: DrugSearchUIProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MedicineSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const fetchResults = async (searchTerm: string) => {
      setLoading(true);
      setError(null);

      // Abort any previous pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const params = new URLSearchParams({ q: searchTerm });
        // NOTE: We do NOT pass clinicId or doctorId from the client anymore. 
        // The server extracts it securely from the authenticated session.
        const response = await fetch(`/api/drugs/search?${params.toString()}`, {
          signal: abortController.signal
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }

        const { data } = await response.json();
        setResults(data || []);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Stale request aborted');
        } else {
          console.error(err);
          setError('Unable to fetch medicines at this time.');
          setResults([]);
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchResults(query.trim());
    }, 300); // Debounce to prevent slamming the server

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort(); // Cleanup on unmount or query change
      }
    };
  }, [query]);

  return (
    <div className="w-full max-w-2xl relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for medicines (e.g. Dolo, Paracetamol)..."
          className="w-full pl-10 pr-12 py-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
        />
        {loading && (
          <div className="absolute right-4 top-4 text-blue-500">
            <Loader2 className="animate-spin h-5 w-5" />
          </div>
        )}
      </div>

      {error && (
        <div className="absolute z-10 w-full mt-2 bg-red-50 text-red-700 p-3 rounded-md flex items-center shadow-md">
          <AlertCircle size={18} className="mr-2" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {!loading && !error && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 p-4 text-center rounded-lg shadow-md text-gray-500">
          No medicines found matching "{query}"
        </div>
      )}

      {results.length > 0 && !error && (
        <ul className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto divide-y divide-gray-100">
          {results.map((result, idx) => {
            const keyId = result.brand_id || result.generic_id || `idx-${idx}`;
            return (
              <li
                key={keyId}
                onClick={() => {
                  onSelect(result);
                  setQuery(''); // Clear search on select
                  setResults([]);
                }}
                className="p-4 hover:bg-blue-50 cursor-pointer flex justify-between items-start transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-900 text-lg">
                    {result.brand_name ? result.brand_name : result.generic_name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {result.brand_name ? `Generic: ${result.generic_name}` : 'Generic Medicine'}
                  </p>
                  {(result.dosage_form || result.strength) && (
                    <div className="flex gap-2 mt-2">
                      {result.dosage_form && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                          {result.dosage_form}
                        </span>
                      )}
                      {result.strength && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">
                          {result.strength}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  {result.rank_weight >= 4 && (
                    <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                      ★ Favorite
                    </span>
                  )}
                  {result.rank_weight >= 3 && result.rank_weight < 4 && (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                      ✓ Preferred
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

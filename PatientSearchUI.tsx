'use client';

import React, { useState, useEffect } from 'react';
import { MedicineSearchResult } from '../../services/drugService';

interface MedicineSelectionUIProps {
  medicine: MedicineSearchResult | null;
  onClear: () => void;
  onSavePrescription: (data: any) => void;
}

export default function MedicineSelectionUI({ medicine, onClear, onSavePrescription }: MedicineSelectionUIProps) {
  const [dosageForm, setDosageForm] = useState<string>('');
  const [strength, setStrength] = useState<string>('');
  const [route, setRoute] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('1-0-1');
  const [duration, setDuration] = useState<string>('5 Days');
  const [instructions, setInstructions] = useState<string>('After Food');

  // Auto-populate fields when a medicine is selected
  useEffect(() => {
    if (medicine) {
      // Rule: Never default unknown medicines to Tablet. 
      // If dosage form cannot be determined, leave it empty (NULL equivalent) and flag for review.
      setDosageForm(medicine.dosage_form || '');
      setStrength(medicine.strength || '');
      setRoute(medicine.route || (medicine.dosage_form === 'Eye Drops' ? 'Topical' : 'Oral'));
    } else {
      setDosageForm('');
      setStrength('');
      setRoute('');
    }
  }, [medicine]);

  if (!medicine) return null;

  const handleSave = () => {
    if (!dosageForm) {
      alert("WARNING: Dosage form could not be automatically determined. Please select or verify the dosage form before saving.");
      // In a real app, this might just highlight the field in red
      return;
    }

    onSavePrescription({
      ...medicine,
      dosageForm,
      strength,
      route,
      frequency,
      duration,
      instructions
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-6 w-full max-w-2xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {medicine.brand_name || medicine.generic_name}
          </h2>
          {medicine.brand_name && (
            <p className="text-sm text-gray-500 mt-1">Generic: {medicine.generic_name}</p>
          )}
        </div>
        <button onClick={onClear} className="text-gray-400 hover:text-red-500">
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dosage Form</label>
          <input
            type="text"
            value={dosageForm}
            onChange={(e) => setDosageForm(e.target.value)}
            className={`w-full p-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${!dosageForm ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
            placeholder="e.g. Tablet, Syrup (Required)"
          />
          {!dosageForm && (
            <p className="text-xs text-red-500 mt-1">⚠️ Please specify dosage form.</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Strength</label>
          <input
            type="text"
            value={strength}
            onChange={(e) => setStrength(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 500mg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
          <input
            type="text"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Oral, Topical"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
          <select 
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1-0-1">1-0-1 (Twice a day)</option>
            <option value="1-1-1">1-1-1 (Thrice a day)</option>
            <option value="1-0-0">1-0-0 (Morning only)</option>
            <option value="0-0-1">0-0-1 (Night only)</option>
            <option value="SOS">SOS (As needed)</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-2/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
          <input
            type="text"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors"
        >
          Add to Prescription
        </button>
      </div>
    </div>
  );
}

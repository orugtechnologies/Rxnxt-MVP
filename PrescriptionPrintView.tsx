'use client';

import React, { useState } from 'react';
import { Patient } from './PatientSearchUI';
import { X } from 'lucide-react';

export default function AddPatientModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: (p: Patient) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, age, gender })
      });
      if (!res.ok) throw new Error('Failed to create patient');
      const { data } = await res.json();
      onSuccess(data);
    } catch (err) {
      console.error(err);
      alert("Failed to save patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold mb-4">Quick Add Patient</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Patient Name</label>
            <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
            <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input required type="number" value={age} onChange={e=>setAge(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select value={gender} onChange={e=>setGender(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-md p-2">
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 mt-4">
            {loading ? 'Saving...' : 'Save Patient'}
          </button>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import PatientSearchUI, { Patient } from '@/components/patients/PatientSearchUI';
import AddPatientModal from '@/components/patients/AddPatientModal';
import DrugSearchUI from '@/components/drugs/DrugSearchUI';
import PrescriptionCart, { PrescribedMedicine } from '@/components/prescriptions/PrescriptionCart';
import { generatePrescriptionPDF } from '@/components/prescriptions/PrescriptionPrintView';

export default function PrescriptionWorkflow() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  
  const [medicines, setMedicines] = useState<PrescribedMedicine[]>([]);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  
  const [saving, setSaving] = useState(false);

  const handleDrugSelect = (drug: any) => {
    const newMed: PrescribedMedicine = {
      id: Math.random().toString(36).substr(2, 9),
      generic_id: drug.generic_id,
      brand_id: drug.brand_id,
      name: drug.brand_name || drug.generic_name,
      dosage_form: drug.dosage_form,
      strength: drug.strength,
      route: drug.route,
      frequency: '',
      duration: '',
      instructions: ''
    };
    setMedicines([...medicines, newMed]);
  };

  const updateMedicine = (id: string, updates: Partial<PrescribedMedicine>) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const savePrescription = async () => {
    if (!patient || medicines.length === 0) return alert('Patient and Medicines are required');
    setSaving(true);
    try {
      const res = await fetch('/api/prescriptions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          chiefComplaint,
          diagnosis,
          notes,
          followUpDate,
          medicines
        })
      });
      
      if (!res.ok) throw new Error('Failed to save prescription');
      
      // Generate PDF on successful save
      generatePrescriptionPDF({
        patient, medicines, chiefComplaint, diagnosis, notes, followUpDate
      });
      
      alert('Prescription Saved & PDF Generated!');
      
      // Reset form
      setPatient(null);
      setMedicines([]);
      setChiefComplaint('');
      setDiagnosis('');
      setNotes('');
      setFollowUpDate('');
    } catch (err) {
      console.error(err);
      alert('Error saving prescription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">RxNXT Workspace</h1>
        
        {/* Step 1: Patient Selection */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">1. Patient</h2>
          {!patient ? (
            <PatientSearchUI 
              onSelect={setPatient} 
              onAddNew={() => setShowAddPatient(true)} 
            />
          ) : (
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div>
                <p className="font-bold text-blue-900 text-lg">{patient.name}</p>
                <p className="text-sm text-blue-700">{patient.phone} • {patient.age}y • {patient.gender}</p>
              </div>
              <button onClick={() => setPatient(null)} className="text-blue-600 text-sm font-medium hover:underline">
                Change Patient
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Clinical Details */}
        {patient && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4 transition-all">
            <h2 className="text-lg font-semibold text-gray-700">2. Clinical Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Chief Complaint" value={chiefComplaint} onChange={e=>setChiefComplaint(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              <input type="text" placeholder="Diagnosis" value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        )}

        {/* Step 3: Medication */}
        {patient && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">3. Medications</h2>
            <DrugSearchUI onSelect={handleDrugSelect} />
            <PrescriptionCart medicines={medicines} onUpdate={updateMedicine} onRemove={removeMedicine} />
            <textarea placeholder="Additional Notes / Advice" value={notes} onChange={e=>setNotes(e.target.value)} className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none mt-4 h-24" />
            
            <div className="flex items-center mt-4">
              <label className="mr-4 text-sm font-medium text-gray-700">Follow-up Date:</label>
              <input type="date" value={followUpDate} onChange={e=>setFollowUpDate(e.target.value)} className="border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        )}

        {/* Action Bar */}
        {patient && medicines.length > 0 && (
          <div className="flex justify-end gap-4 mt-8">
            <button 
              onClick={savePrescription}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors disabled:bg-green-300"
            >
              {saving ? 'Saving...' : 'Save & Print PDF'}
            </button>
          </div>
        )}
      </div>

      {showAddPatient && (
        <AddPatientModal 
          onClose={() => setShowAddPatient(false)} 
          onSuccess={(p) => { setPatient(p); setShowAddPatient(false); }} 
        />
      )}
    </div>
  );
}

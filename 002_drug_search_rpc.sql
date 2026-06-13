import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const clinicId = user.user_metadata?.clinic_id;
  if (!clinicId) return NextResponse.json({ error: 'No clinic found' }, { status: 403 });

  try {
    const body = await request.json();
    const { patientId, chiefComplaint, diagnosis, notes, followUpDate, medicines } = body;

    if (!patientId || !medicines || medicines.length === 0) {
      return NextResponse.json({ error: 'Patient ID and at least 1 medicine are required' }, { status: 400 });
    }

    // 1. Create Encounter
    const { data: encounter, error: encError } = await supabase.from('encounters').insert({
      clinic_id: clinicId,
      doctor_id: user.id,
      patient_id: patientId,
      chief_complaint: chiefComplaint,
      diagnosis: diagnosis,
      notes: notes,
      follow_up_date: followUpDate || null
    }).select().single();

    if (encError) throw encError;

    // 2. Create Prescription
    const { data: rx, error: rxError } = await supabase.from('prescriptions').insert({
      clinic_id: clinicId,
      encounter_id: encounter.id,
      doctor_id: user.id,
      patient_id: patientId
    }).select().single();

    if (rxError) throw rxError;

    // 3. Create Prescription Medicines
    const medicineInserts = medicines.map((m: any) => ({
      clinic_id: clinicId,
      prescription_id: rx.id,
      generic_id: m.generic_id,
      brand_id: m.brand_id,
      dosage_form: m.dosage_form,
      strength: m.strength,
      route: m.route,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions
    }));

    const { error: medError } = await supabase.from('prescription_medicines').insert(medicineInserts);
    
    if (medError) throw medError;

    return NextResponse.json({ success: true, encounterId: encounter.id, prescriptionId: rx.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

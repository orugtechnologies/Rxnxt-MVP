import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Notice: We completely ignore any clinicId passed from the client
    const { brandId, genericId, isPreferred } = body;

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: any[]) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch (e) {}
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Securely derive clinic ID from the verified JWT claims
    const clinicId = user.user_metadata?.clinic_id;
    if (!clinicId) {
      return NextResponse.json({ error: 'User does not belong to a valid clinic' }, { status: 403 });
    }

    if (!brandId && !genericId) {
      return NextResponse.json({ error: 'Either Brand ID or Generic ID is required' }, { status: 400 });
    }

    // Insert using the verified clinic's ID
    const { data, error } = await supabase.from('clinic_preferences').insert({
      clinic_id: clinicId, // Strictly derived from server session JWT
      brand_id: brandId,
      generic_id: genericId,
      is_preferred: isPreferred !== undefined ? isPreferred : true
    });

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

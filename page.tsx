import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Notice: We completely ignore any doctorId passed from the client
    const { brandId, genericId, defaultRoute, defaultFreq, defaultDuration, defaultInstructions } = body;

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

    if (!brandId && !genericId) {
      return NextResponse.json({ error: 'Either Brand ID or Generic ID is required' }, { status: 400 });
    }

    // Insert using the verified user's ID
    const { data, error } = await supabase.from('doctor_favorites').insert({
      doctor_id: user.id, // Strictly derived from the server session
      brand_id: brandId,
      generic_id: genericId,
      default_route: defaultRoute,
      default_frequency: defaultFreq,
      default_duration: defaultDuration,
      default_instructions: defaultInstructions
    });

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

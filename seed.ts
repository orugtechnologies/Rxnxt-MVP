import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
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

    // Simple ping to Supabase to verify DB connectivity
    const { error } = await supabase.from('drug_group_master').select('id').limit(1);
    
    if (error) throw error;

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      latency_ms: Date.now() - startTime,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

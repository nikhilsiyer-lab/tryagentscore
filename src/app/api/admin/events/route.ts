import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getCurrentUser } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const { event_type, event_data } = await request.json();
    const user = await getCurrentUser();
    const supabase = await createClient();

    // Insert the event
    const { error } = await supabase.from('user_events').insert({
      user_id: user?.id || null,
      session_id: user?.id ? null : request.headers.get('x-forwarded-for') || 'anon',
      event_type,
      event_data
    });

    if (error) {
      console.error('Failed to log event:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

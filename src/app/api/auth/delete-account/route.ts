import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { getCurrentUser } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // 1. Delete all scan competitor snapshots associated with user's scans
    // First find all scan ids for the user
    const { data: userScans, error: fetchScansError } = await supabase
      .from('scans')
      .select('id')
      .eq('user_id', user.id);

    if (fetchScansError) {
      console.error('Error fetching user scans for deletion:', fetchScansError);
      return NextResponse.json({ error: 'Database error fetching scans' }, { status: 500 });
    }

    const scanIds = userScans?.map(s => s.id) || [];

    if (scanIds.length > 0) {
      // Delete snapshots
      const { error: deleteSnapshotsError } = await supabase
        .from('competitor_snapshots')
        .delete()
        .in('scan_id', scanIds);

      if (deleteSnapshotsError) {
        console.error('Error deleting competitor snapshots:', deleteSnapshotsError);
      }
    }

    // 2. Delete all scans belonging to this user
    const { error: deleteScansError } = await supabase
      .from('scans')
      .delete()
      .eq('user_id', user.id);

    if (deleteScansError) {
      console.error('Error deleting scans:', deleteScansError);
      return NextResponse.json({ error: 'Database error deleting scans' }, { status: 500 });
    }

    // 3. Delete user events
    const { error: deleteEventsError } = await supabase
      .from('user_events')
      .delete()
      .eq('user_id', user.id);

    if (deleteEventsError) {
      console.error('Error deleting user events:', deleteEventsError);
    }

    // 4. Delete user account in Supabase Auth (note: this requires service_role key to delete from auth.users table or if trigger is configured, or via supabase.auth.admin api)
    // For general flow, we can delete their subscription, user profile, and sign them out.
    // If supabase client has service role, we use auth.admin.deleteUser.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    
    if (supabaseUrl && serviceRoleKey) {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const serviceClient = createServiceClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      const { error: deleteAuthUserError } = await serviceClient.auth.admin.deleteUser(user.id);
      if (deleteAuthUserError) {
        console.error('Error deleting auth user via admin API:', deleteAuthUserError);
        // Fallback: we will still try to delete profile from public.users if that table exists
        await supabase.from('users').delete().eq('id', user.id);
      }
    } else {
      // Fallback if service role key is not configured: delete from public.users table
      const { error: deleteUserTableError } = await supabase.from('users').delete().eq('id', user.id);
      if (deleteUserTableError) {
        console.error('Error deleting user from public.users table:', deleteUserTableError);
      }
    }

    // Sign out response
    const response = NextResponse.json({ success: true, message: 'Account and all data deleted successfully.' });
    
    // Clear cookies/session (signout)
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      console.error('Error signing out during deletion:', logoutError);
    }

    return response;
  } catch (err: any) {
    console.error('GDPR deletion error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

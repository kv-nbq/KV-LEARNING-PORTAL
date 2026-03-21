import { supabase } from './supabase.js';

export async function protectPage(requiredRole) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Check Login
    if (!user) {
        window.location.href = '../login.html'; // Adjust path if in subfolder
        return null;
    }

    // 2. Fetch Role
    const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !profile || profile.role !== requiredRole) {
        alert("Access Denied: Unauthorized Role");
        await supabase.auth.signOut();
        window.location.href = '../login.html';
        return null;
    }

    // 3. Student Specific: Force Profile Completion
    if (requiredRole === 'student' && !profile.profile_completed) {
        if (!window.location.pathname.includes('profile.html')) {
            window.location.href = 'profile.html';
            return null;
        }
    }

    return { user, profile };
}
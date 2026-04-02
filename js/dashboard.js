import { supabase } from './supabase.js';

export const DashboardManager = {
    // 1. Protection System (Updated to ensure profile data is available)
    async protectPage(requiredRole) {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            window.location.replace('login.html');
            return null;
        }

        // We check the 'users' table for the profile
        const { data: profile, error: roleError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (roleError || !profile || profile.role !== requiredRole) {
            console.error("Access Denied or Profile Missing");
            window.location.replace('login.html');
            return null;
        }

        return { user, profile };
    },

    // 2. Load Stats for the Dashboard Cards (Updated to 'test_results')
    async loadStudentStats(userId) {
        // Now pointing to 'test_results' with the new column names
        const { data, error } = await supabase
            .from('test_results') 
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }); // Changed from completed_at to created_at

        if (error) {
            console.error("Error fetching stats:", error.message);
            return { lastScore: 0, totalTests: 0, avgPace: 0, accuracy: 0 };
        }

        if (data && data.length > 0) {
            // Calculate total correct/wrong for lifetime stats if needed
            const latest = data[0];
            return {
                lastScore: latest.score,
                totalTests: data.length,
                // Using the new column 'time_taken_seconds'
                avgPace: latest.time_taken_seconds || 0,
                accuracy: latest.percentage || 0,
                lastSubject: latest.subject
            };
        }

        // Default fallback if no tests found in database
        return { lastScore: '--', totalTests: 0, avgPace: 0, accuracy: 0 };
    },

    // 3. New Feature: Check KV Status
    // This helps the UI decide if it should show "Cloud Synced" icons
    isKVUser(profile) {
        if (!profile) return false;
        return profile.school_type === 'KV' || 
               (profile.school_name && profile.school_name.toUpperCase().includes('KENDRIYA'));
    },

    async logout() {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Logout Error:", error.message);
        
        // Clear local storage but keep theme settings if you have any
        localStorage.clear();
        window.location.replace('login.html');
    }
};

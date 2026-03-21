import { supabase } from './supabase.js';

export const DashboardManager = {
    // 1. Protection System
    async protectPage(requiredRole) {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            window.location.replace('login.html');
            return null;
        }

        const { data: profile, error: roleError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (roleError || !profile || profile.role !== requiredRole) {
            console.error("Access Denied");
            window.location.replace('login.html');
            return null;
        }

        return { user, profile };
    },

    // 2. Load Stats for the Dashboard Cards
    async loadStudentStats(userId) {
        // We use 'results' as the standard table name here
        const { data, error } = await supabase
            .from('results') 
            .select('*')
            .eq('user_id', userId)
            .order('completed_at', { ascending: false });

        if (error) return { lastScore: 0, totalTests: 0, avgPace: 0 };

        if (data.length > 0) {
            return {
                lastScore: data[0].score,
                totalTests: data.length,
                avgPace: data[0].average_time_per_question || 0
            };
        }
        return { lastScore: '--', totalTests: 0, avgPace: 0 };
    },

    async logout() {
        await supabase.auth.signOut();
        localStorage.clear();
        window.location.replace('login.html');
    }
};
import { supabase } from './supabase.js';
import { ResultEngine } from './results.js';

export async function finishTest(questions, userAnswers, startTime, testMetadata) {
    try {
        // 1. Calculate stats using the engine
        const stats = ResultEngine.calculate(questions, userAnswers, startTime);

        // 2. Get current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // 3. Fetch latest profile from 'users' table
        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        // 4. Save to Database ('test_results') and update 'users' stats
        await ResultEngine.saveResult(testMetadata, stats, user, profile);

        // 5. Store data for results.html to display
        const finalState = {
            ...testMetadata,
            questions,
            userAnswers,
            stats,
            profile // Passing the profile object for UI display
        };
        
        localStorage.setItem('activeTest', JSON.stringify(finalState));
        
        // 6. Redirect to results page
        window.location.href = 'results.html';
    } catch (error) {
        console.error("Error finishing test:", error.message);
        alert("Failed to save results. Please check your connection.");
    }
}

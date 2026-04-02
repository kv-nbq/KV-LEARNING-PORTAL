import { supabase } from './supabase.js';

export const ResultEngine = {
    /**
     * SECTION 1: Calculation Logic
     * Computes scores with +4 / -1 logic and timing analytics.
     */
    calculate(questions, userAnswers, startTime) {
        let correct = 0;
        let wrong = 0;
        let skipped = 0;
        const endTime = Date.now();
        
        // Time calculation in seconds
        const totalTimeTaken = startTime ? Math.floor((endTime - startTime) / 1000) : 0;
        
        questions.forEach((q) => {
            const userAnswer = userAnswers[q.id];
            // Supports multiple DB naming conventions for the correct answer field
            const correctAnswer = q.correct_answer || q.correct_option || q.answer;
            
            if (!userAnswer) {
                skipped++;
            } else if (String(userAnswer).trim().toUpperCase() === String(correctAnswer).trim().toUpperCase()) {
                correct++;
            } else {
                wrong++;
            }
        });

        const total = questions.length;
        // Logic: +4 for Correct, -1 for Wrong, 0 for Skipped
        const finalScore = (correct * 4) - (wrong * 1);
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
        const averageTime = total > 0 ? parseFloat((totalTimeTaken / total).toFixed(1)) : 0;

        return { 
            total, 
            correct, 
            wrong, 
            skipped,
            percentage, 
            score: finalScore, 
            totalTimeTaken, 
            averageTime     
        };
    },

    /**
     * SECTION 2: Universal Storage Logic
     * Saves results for EVERY student to Supabase 'test_results' table
     * Updates cumulative points in the 'users' table.
     */
    async saveResult(testData, stats, user, profile) {
        // 1. Create the detailed record for the 'test_results' table
        const resultPayload = {
            student_id: user.id, // Linking to the users table
            student_name: profile?.full_name || 'Anonymous Student',
            student_class: profile?.class || 'N/A',
            school_name: profile?.school_name || 'Private/Other',
            subject: testData.subject || 'General',
            chapter: testData.chapter || 'Practice Test',
            total_questions: stats.total,
            score: stats.score,
            percentage: stats.percentage,
            correct_answers: stats.correct,
            wrong_answers: stats.wrong,
            time_taken_seconds: stats.totalTimeTaken,
            created_at: new Date().toISOString()
        };

        if (user) {
            try {
                // A. Insert specific test attempt into 'test_results'
                const { error: testError } = await supabase
                    .from('test_results')
                    .insert([resultPayload]);
                
                if (testError) throw testError;

                // B. Update cumulative stats in 'users' table for Leaderboard
                // Ensures points don't drop below 0 if you prefer
                const newTotalPoints = (profile?.total_points || 0) + stats.score;
                
                const { error: userError } = await supabase
                    .from('users')
                    .update({
                        total_points: newTotalPoints,
                        total_tests: (profile?.total_tests || 0) + 1,
                        last_active: new Date().toISOString()
                    })
                    .eq('id', user.id);

                if (userError) throw userError;

                console.log("Cloud Sync: Success. Result and User Stats updated.");
                return { status: 'SYNCED' };

            } catch (error) {
                console.error("Database Save Failed:", error.message);
                // Fallback to local storage so user doesn't lose data if internet fails
                this._saveToLocal(resultPayload, profile);
                return { status: 'LOCAL_ONLY', error: error.message };
            }
        } else {
            // If no user is logged in (Guest)
            this._saveToLocal(resultPayload, profile);
            return { status: 'LOCAL_ONLY', type: 'GUEST' };
        }
    },

    /**
     * Internal helper for local fallback
     */
    _saveToLocal(payload, profile) {
        try {
            const history = JSON.parse(localStorage.getItem('test_history') || '[]');
            history.unshift({ 
                ...payload, 
                student_name: profile?.full_name || 'Guest User' 
            });
            // Limit local history to 50 items
            localStorage.setItem('test_history', JSON.stringify(history.slice(0, 50)));
        } catch (e) {
            console.error("Local Save Error:", e);
        }
    }
};

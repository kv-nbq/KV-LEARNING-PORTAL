import { supabase } from './supabase.js';

export const ResultEngine = {
    /**
     * SECTION 1: Calculation Logic
     * Computes scores, percentages, and timing analytics.
     */
    calculate(questions, userAnswers, startTime) {
        let correct = 0;
        const endTime = Date.now();
        
        // Calculate Total Time in Seconds
        const totalTimeTaken = startTime ? Math.floor((endTime - startTime) / 1000) : 0;
        
        questions.forEach((q) => {
            // Robust check for answer (handles different column names like correct_option or answer)
            const userAnswer = userAnswers[q.id];
            const correctAnswer = q.correct_option || q.correct_answer || q.answer;
            
            if (userAnswer && userAnswer === correctAnswer) {
                correct++;
            }
        });

        const total = questions.length;
        const wrong = total - correct;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        // Average time spent per question (formatted to 1 decimal)
        const averageTime = total > 0 ? parseFloat((totalTimeTaken / total).toFixed(1)) : 0;

        return { 
            total, 
            correct, 
            wrong, 
            percentage, 
            score: correct,
            totalTimeTaken, 
            averageTime     
        };
    },

    /**
     * SECTION 2: Storage & Sync Logic
     * KV students -> Supabase Cloud
     * Non-KV students -> Local Browser Storage
     */
    async saveResult(testData, stats, user) {
        // 1. Check Student Type (Defaults to KV if not specified)
        const isKV = localStorage.getItem('school_type') === 'KV' || 
                     localStorage.getItem('is_kv_student') === 'true' || 
                     true; // Set to true by default for your project
        
        // 2. Gather Profile Data
        const profile = JSON.parse(localStorage.getItem('studentProfile')) || {};
        const studentName = profile.name || user?.user_metadata?.full_name || 'Anonymous Student';
        const studentClass = profile.class || localStorage.getItem('user_class') || 'N/A';

        // 3. Prepare common payload
        const resultPayload = {
            subject: testData.subject || 'General',
            chapter: testData.chapter || 'Unit 1',
            total_questions: stats.total,
            score: stats.score,
            percentage: stats.percentage,
            correct_answers: stats.correct,
            wrong_answers: stats.wrong,
            total_time_taken: stats.totalTimeTaken,
            average_time_per_question: stats.averageTime,
            completed_at: new Date().toISOString()
        };

        try {
            if (isKV && user) {
                /**
                 * CASE A: KV STUDENT -> SUPABASE
                 */
                const { error } = await supabase.from('results').insert([{
                    user_id: user.id,
                    student_name: studentName,
                    class: studentClass,
                    ...resultPayload
                }]);
                
                if (error) throw error;
                
                return { type: 'KV', status: 'SYNCED' };
            } else {
                /**
                 * CASE B: NON-KV OR LOGGED OUT -> LOCALSTORAGE
                 */
                const history = JSON.parse(localStorage.getItem('test_history') || '[]');
                const localRecord = { 
                    ...resultPayload, 
                    student_name: studentName,
                    class: studentClass 
                };
                
                history.unshift(localRecord);
                // Keep only last 20 records
                localStorage.setItem('test_history', JSON.stringify(history.slice(0, 20))); 
                
                return { type: 'LOCAL', status: 'SAVED_LOCALLY' };
            }
        } catch (error) {
            console.error("ResultEngine Error:", error.message);
            // Fallback to local save if cloud fails
            localStorage.setItem('pending_sync', JSON.stringify(resultPayload));
            return { type: 'ERROR', status: 'LOCAL_FALLBACK', message: error.message };
        }
    }
};

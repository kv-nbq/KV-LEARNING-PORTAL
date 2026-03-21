import { supabase } from './supabase.js';

let questions = [];
let currentIndex = 0;
let userAnswers = {}; 
let startTime = Date.now();
let questionStartTime = Date.now();
let timePerQuestion = {}; 
let timerInterval;

/**
 * 1. INITIALIZE TEST
 */
async function initTest() {
    console.log("Initializing Test Node...");
    
    // Clear old session data to prevent bugs
    localStorage.removeItem('userAnswers');
    localStorage.removeItem('timeAnalytics');
    localStorage.removeItem('activeTest');

    const params = new URLSearchParams(window.location.search);
    const qClass = params.get('class') || '11'; 
    const qSubject = params.get('subject') || 'Biology';

    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('class', qClass)
        .eq('subject', qSubject)
        .limit(10);

    if (error || !data || data.length === 0) {
        console.error("Fetch Error:", error || "No questions found");
        alert("SYSTEM_OFFLINE: No questions found for " + qSubject);
        window.location.href = 'dashboard.html';
        return;
    }

    // Shuffle questions randomly if you want varied tests
    questions = data.sort(() => Math.random() - 0.5);

    // Save test session info for result.html
    localStorage.setItem('activeTest', JSON.stringify({
        subject: qSubject,
        class: qClass,
        totalQuestions: questions.length,
        questions: questions // We pass the full objects to compare correct_answer on the next page
    }));
    
    localStorage.setItem('testStartTime', Date.now());
    startTime = Date.now();

    renderQuestion();
    startTimer();
}

/**
 * 2. RENDER QUESTION
 */
function renderQuestion() {
    const q = questions[currentIndex];
    questionStartTime = Date.now(); 
    
    const textEl = document.getElementById('question-text');
    const countEl = document.getElementById('question-count');
    const progressEl = document.getElementById('progress-bar');
    const nextBtn = document.getElementById('next-btn');

    if (textEl) textEl.innerText = q.question_text;
    if (countEl) countEl.innerText = `QUESTION ${(currentIndex + 1).toString().padStart(2, '0')}/${questions.length}`;
    
    const grid = document.getElementById('options-grid');
    grid.innerHTML = '';

    ['a', 'b', 'c', 'd'].forEach(letter => {
        const optionText = q[`opt_${letter}`] || q[`option_${letter}`];
        if (!optionText) return;

        const btn = document.createElement('button');
        btn.className = "cyber-card p-5 text-left hover:bg-white/5 transition-all border border-white/10 group flex items-center gap-4 w-full mb-3 rounded-xl";
        
        if (userAnswers[q.id] === letter) {
            btn.classList.add('border-indigo-500', 'bg-indigo-500/10');
        }

        btn.innerHTML = `
            <span class="w-8 h-8 rounded bg-white/5 flex items-center justify-center font-black group-hover:text-indigo-500 text-sm uppercase">${letter}</span>
            <span class="flex-1 text-sm md:text-base">${optionText}</span>
        `;
        
        btn.onclick = () => window.selectOption(letter, btn);
        grid.appendChild(btn);
    });

    if (nextBtn) {
        if (!userAnswers[q.id]) {
            nextBtn.classList.add('opacity-50', 'pointer-events-none');
        } else {
            nextBtn.classList.remove('opacity-50', 'pointer-events-none');
        }
        nextBtn.innerText = (currentIndex === questions.length - 1) ? "SUBMIT ASSESSMENT" : "NEXT QUESTION";
    }
    
    if (progressEl) progressEl.style.width = `${((currentIndex + 1) / questions.length) * 100}%`;
}

/**
 * 3. HANDLE OPTION SELECTION
 */
window.selectOption = (choice, element) => {
    const q = questions[currentIndex];
    userAnswers[q.id] = choice; 

    // Update time analytics for this specific question
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    timePerQuestion[q.id] = (timePerQuestion[q.id] || 0) + timeSpent;
    questionStartTime = Date.now(); // Reset for this question if they change their mind

    // UI Feedback
    document.querySelectorAll('#options-grid button').forEach(b => {
        b.classList.remove('border-indigo-500', 'bg-indigo-500/10');
    });
    element.classList.add('border-indigo-500', 'bg-indigo-500/10');
    
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) nextBtn.classList.remove('opacity-50', 'pointer-events-none');
};

/**
 * 4. NEXT / FINISH NAVIGATION
 */
window.nextQuestion = async () => {
    const q = questions[currentIndex];
    
    // Add final seconds spent on the current question
    const finalSeconds = Math.floor((Date.now() - questionStartTime) / 1000);
    timePerQuestion[q.id] = (timePerQuestion[q.id] || 0) + finalSeconds;

    if (currentIndex < questions.length - 1) {
        currentIndex++;
        renderQuestion();
    } else {
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.innerText = "PROCESSING...";
            nextBtn.disabled = true;
        }
        finishTest();
    }
};

/**
 * 5. FINALIZE AND REDIRECT
 */
function finishTest() {
    // Final data push to LocalStorage
    localStorage.setItem('userAnswers', JSON.stringify(userAnswers));
    localStorage.setItem('timeAnalytics', JSON.stringify(timePerQuestion));
    localStorage.setItem('testEndTime', Date.now());

    // Switch to singular result.html
    window.location.href = 'result.html';
}

/**
 * 6. TIMER LOGIC
 */
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = (elapsed % 60).toString().padStart(2, '0');
        const timerEl = document.getElementById('timer');
        if(timerEl) timerEl.innerText = `${mins}:${secs}`;
    }, 1000);
}

// Kickstart
initTest();
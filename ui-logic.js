// --- THEME ENGINE ---
// Rule: Check localStorage so the user's preference stays after refresh
let isDarkMode = localStorage.getItem('theme') !== 'light';

function initTheme() {
    const body = document.body;
    // Apply initial state
    if (isDarkMode) {
        body.classList.add('theme-dark');
        body.classList.remove('theme-light');
    } else {
        body.classList.add('theme-light');
        body.classList.remove('theme-dark');
        updateToggleUI(false);
    }
}

export function toggleTheme() {
    isDarkMode = !isDarkMode;
    const body = document.body;
    
    // Save preference (Rule: Persistent UI)
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

    if (isDarkMode) {
        body.classList.replace('theme-light', 'theme-dark');
    } else {
        body.classList.replace('theme-dark', 'theme-light');
    }
    
    updateToggleUI(isDarkMode);

    // Rule: Update 3D elements if they exist (Three.js integration)
    if (window.update3DTheme) {
        window.update3DTheme(!isDarkMode);
    }
}

function updateToggleUI(dark) {
    const dot = document.getElementById('toggle-dot');
    const bg = document.getElementById('toggle-bg');
    
    if (!dot || !bg) return;

    if (dark) {
        dot.style.transform = 'translateX(0px)';
        bg.style.backgroundColor = '#1e293b'; // Slate 800
    } else {
        dot.style.transform = 'translateX(28px)';
        bg.style.backgroundColor = '#ec4899'; // Pink 500
    }
}

// --- MODAL ENGINE ---
export function openModal() {
    const modal = document.getElementById('login-modal');
    const content = document.getElementById('modal-content');
    
    if (!modal || !content) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Tiny delay allows the CSS transition to trigger
    requestAnimationFrame(() => {
        content.classList.add('modal-active');
    });
}

export function closeModal() {
    const modal = document.getElementById('login-modal');
    const content = document.getElementById('modal-content');
    
    if (!modal || !content) return;

    content.classList.remove('modal-active');
    
    // Wait for the CSS transition (500ms) before hiding
    setTimeout(() => {
        modal.classList.replace('flex', 'hidden');
    }, 500);
}

// Expose to HTML
window.toggleTheme = toggleTheme;
window.openModal = openModal;
window.closeModal = closeModal;

// Run on load
initTheme();
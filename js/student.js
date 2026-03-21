import { supabase } from './supabase.js';

async function handleProfileSubmit(event) {
    event.preventDefault();
    
    // Get current authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return window.location.href = 'login.html';

    const type = document.getElementById('school-type').value; // 'KV' or 'NON-KV'
    
    // Prepare core data
    const formData = {
        name: document.getElementById('full-name').value,
        dob: document.getElementById('dob').value,
        class: document.getElementById('class-select').value,
        last_updated: new Date().toISOString()
    };

    try {
        if (type === 'KV') {
            // Prepare KV Specific Data
            const kvData = {
                ...formData,
                id: user.id,
                email: user.email,
                school_name: document.getElementById('school-name').value,
                region: document.getElementById('region').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value
            };

            // Save to 'students' table
            const { error } = await supabase.from('students').upsert([kvData]);
            if (error) throw error;
            
            // Mark user record as KV
            await supabase.from('users').update({ 
                is_kv_student: true,
                full_name: formData.name, // Sync name to users table
                class: formData.class 
            }).eq('id', user.id);
        } 
        else {
            // NON-KV Logic: Save to localStorage AND update users table 
            // (Updating users table ensures the dashboard/results work)
            localStorage.setItem("studentProfile", JSON.stringify({ ...formData, type: 'non-kv' }));
            
            await supabase.from('users').update({ 
                is_kv_student: false,
                full_name: formData.name,
                class: formData.class 
            }).eq('id', user.id);
        }

        alert("Profile updated successfully! ✅");
        window.location.href = 'dashboard.html';

    } catch (err) {
        console.error("Profile Error:", err);
        alert("System Error: Could not save profile data.");
    }
}

// Ensure the form listener is attached
const profileForm = document.getElementById('profile-form');
if (profileForm) {
    profileForm.addEventListener('submit', handleProfileSubmit);
}

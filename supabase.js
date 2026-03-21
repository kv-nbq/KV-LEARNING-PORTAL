import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// This URL looks correct
const supabaseUrl = 'https://mpbpgueivqlzpvyyuciq.supabase.co'

// REPLACE THIS: The key below must start with "eyJ..."
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wYnBndWVpdnFsenB2eXl1Y2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MzU1ODAsImV4cCI6MjA4OTIxMTU4MH0.rI9dtMUiXUWLCXqNi9wYh_eMsvWxIixklaq7u_aAQeE'

export const supabase = createClient(supabaseUrl, supabaseKey)
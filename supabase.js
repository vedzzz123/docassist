import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_ANON_KEY = 'your-anon-key';

export const supabase = createClient(
    'https://uzybksfptohhqyrtoanq.supabase.co', 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6eWJrc2ZwdG9oaHF5cnRvYW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDkxNTMsImV4cCI6MjA1OTA4NTE1M30.dwGisDSYpZR3ekFEJ7afoiQYD54DAbeY5ddVyb9FN3o'
  );
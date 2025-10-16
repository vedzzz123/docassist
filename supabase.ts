import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import 'react-native-url-polyfill/auto';

const supabaseUrl = "https://uzybksfptohhqyrtoanq.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6eWJrc2ZwdG9oaHF5cnRvYW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1MDkxNTMsImV4cCI6MjA1OTA4NTE1M30.dwGisDSYpZR3ekFEJ7afoiQYD54DAbeY5ddVyb9FN3o"; // Your actual key

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

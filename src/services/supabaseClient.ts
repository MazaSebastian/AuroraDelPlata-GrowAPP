import { createClient } from '@supabase/supabase-js';

// Hardcoded for debugging to ensure we hit the correct project
const supabaseUrl = "https://tfzfwwrpjjlthiunzqde.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmemZ3d3JwampsdGhpdW56cWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NDU4OTksImV4cCI6MjA4NTIyMTg5OX0.8EPCeAEd2TTxbFIgiatiMrKcL9nyjuOAjIcCRGXZFao";

console.log("Supabase Client Init - FORCED URL:", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

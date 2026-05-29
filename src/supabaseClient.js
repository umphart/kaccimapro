// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
}

export const supabase = createClient(
  supabaseUrl || 'https://lmifvhpadhvkwiibvbos.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtaWZ2aHBhZGh2a3dpaWJ2Ym9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4MDA3NjIsImV4cCI6MjA5NTM3Njc2Mn0.iwiljw8J74rrMbPV5OGwY_ImMrrFoKM8B9wUFjdH4fk'
)
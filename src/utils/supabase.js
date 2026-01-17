// src/supabase.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tohsfsdksycwdjrkcfzy.supabase.co'
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvaHNmc2Rrc3ljd2RqcmtjZnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjA4NjQsImV4cCI6MjA4MzkzNjg2NH0.ur-qVDFiSOXu18tTXeAawZgtCCJS_inx9eFsDrCdEks' // Find this in the Supabase dashboard
export const supabase = createClient(supabaseUrl, supabaseKey)

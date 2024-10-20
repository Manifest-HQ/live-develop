import { createClient } from '@supabase/supabase-js'

// SUPABASE instance of the project
const supabaseUrl = '{{SUPABASE_URL}}'
// this is the PUBLIC KEY, so it is safe to have it hard coded here
const supabaseKey = '{{SUPABASE_KEY}}'

const supabase = createClient(supabaseUrl, supabaseKey)

const supabaseManifestSchema = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'manifest'
  }
})

const supabaseManifestDB = createClient(
  // Manifest HQ Main Supabase URL
  'https://dxusbfemztqipqvlneat.supabase.co',
  // Manifest HQ Main Supabase PUBLIC Key
  // TODO change this to point to a backend using a key designed for the project
  // and that backend will authenticate the request and make the updates to
  // supabase
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dXNiZmVtenRxaXBxdmxuZWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTU4NjUyMDgsImV4cCI6MjAxMTQ0MTIwOH0.xlpgbon7iolkJa6YB-E1hXHQFyDdN4FDVZBg6To0sos'
)

export { supabase, supabaseManifestSchema, supabaseManifestDB }

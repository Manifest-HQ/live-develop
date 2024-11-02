import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '{{SUPABASE_URL}}'
const supabasePublishableKey = '{{SUPABASE_PUBLISHABLE_KEY}}'

const supabase = createClient(supabaseUrl, supabasePublishableKey)

export default supabase

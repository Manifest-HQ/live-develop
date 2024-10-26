import { createClient } from '@supabase/supabase-js'

const supabaseUrl = '{{SUPABASE_URL}}'
const supabasePublicKey = '{{SUPABASE_PUBLIC_KEY}}'

const supabase = createClient(supabaseUrl, supabasePublicKey)

export default supabase

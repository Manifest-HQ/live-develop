import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uzskfrmzzqmvsaxzeimy.supabase.co'
const supabasePublicKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6c2tmcm16enFtdnNheHplaW15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2OTcwMTgsImV4cCI6MjA0NTI3MzAxOH0.oZfMNSvFdPDxtR62pusD9emmtNCrRLHdqAZhniK7kHc'

const supabase = createClient(supabaseUrl, supabasePublicKey)

export default supabase

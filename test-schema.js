import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('Registros_Clinicos').select('*').limit(1);
  if (error) console.log("Error:", error);
  else console.log("Data columns:", data.length > 0 ? Object.keys(data[0]) : "Empty table");
}
check();

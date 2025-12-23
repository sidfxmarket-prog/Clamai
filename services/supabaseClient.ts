
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.0';

const supabaseUrl = 'https://qhowwifzvlwfzwzekbil.supabase.co';
const supabaseKey = 'sb_publishable_to2jT-q3MTdHZS5MVtOSfA_moQoddxf';

export const supabase = createClient(supabaseUrl, supabaseKey);

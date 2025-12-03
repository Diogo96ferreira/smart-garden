import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🌱 Starting Plant DB Build Script...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables.');
    console.error(
      '   Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY) are set.',
    );
    process.exit(1);
  }

  const _supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Read local calendar data
  const calendarPath = path.join(__dirname, '..', 'public', 'calendario.json');
  if (!fs.existsSync(calendarPath)) {
    console.warn(`⚠️  Calendar file not found at ${calendarPath}`);
    return;
  }

  const calendarData = JSON.parse(fs.readFileSync(calendarPath, 'utf8'));
  const zones = calendarData.zonas || {};
  const calendar = calendarData.calendario || {};

  console.log(`✅ Loaded calendar data. Found ${Object.keys(zones).length} zones.`);

  // Count total crops across zones
  let cropCount = 0;
  for (const zone in calendar) {
    cropCount += Object.keys(calendar[zone]).length;
  }
  console.log(`📊 Found approximately ${cropCount} crop entries across all zones.`);

  // 2. (Optional) Sync to Database
  // This section is a placeholder for where you would insert this data into a 'plant_library' or 'crops' table.
  // Example:
  /*
    const { error } = await supabase.from('plant_library').upsert(
      Object.keys(calendar['ZONA 1']).map(name => ({ name, ... }))
    );
    if (error) console.error('Error syncing:', error);
    */

  console.log('ℹ️  Database sync logic is currently commented out. (Requires target table schema)');
  console.log('✅ Build script completed successfully.');
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});

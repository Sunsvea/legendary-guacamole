/**
 * Database deployment script for Supabase tables and policies
 * Run with: npx tsx scripts/deploy-database.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { getSupabaseClient } from '../src/lib/supabase';

async function deployDatabase() {
  console.log('🚀 Starting Supabase database deployment...');
  
  const supabase = getSupabaseClient();
  
  // List of migration files in order
  const migrations = [
    '001_create_routes_table.sql',
    '002_create_user_preferences_table.sql'
  ];

  for (const migration of migrations) {
    console.log(`📄 Applying migration: ${migration}`);
    
    try {
      // Read migration file
      const migrationPath = join(process.cwd(), 'supabase', 'migrations', migration);
      const sql = readFileSync(migrationPath, 'utf-8');
      
      // Execute migration
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        // Try alternative approach using raw SQL execution
        console.log(`⚠️  RPC failed, trying direct SQL execution for ${migration}`);
        
        // Split SQL into individual statements and execute them
        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          if (statement) {
            console.log(`  Executing: ${statement.substring(0, 60)}...`);
            // Note: This would typically use a database admin connection
            // For development, we'll log the statements to be run manually
          }
        }
        
        console.log(`❌ Migration ${migration} needs manual execution`);
        console.log('SQL to execute manually in Supabase SQL Editor:');
        console.log('='.repeat(60));
        console.log(sql);
        console.log('='.repeat(60));
      } else {
        console.log(`✅ Migration ${migration} applied successfully`);
      }
    } catch (err) {
      console.error(`❌ Error applying migration ${migration}:`, err);
      
      // Print SQL for manual execution
      console.log('\n📋 SQL to execute manually in Supabase SQL Editor:');
      console.log('='.repeat(60));
      const migrationPath = join(process.cwd(), 'supabase', 'migrations', migration);
      const sql = readFileSync(migrationPath, 'utf-8');
      console.log(sql);
      console.log('='.repeat(60));
    }
  }
  
  console.log('\n🎯 Database deployment completed!');
  console.log('\n📋 Manual Steps Required:');
  console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/hvwohdkcjcaooebsahjj');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Execute the migration SQL shown above');
  console.log('4. Verify tables are created with proper RLS policies');
  
  console.log('\n🔍 Verification Steps:');
  console.log('- Check that "routes" table exists with proper indexes');
  console.log('- Check that "user_preferences" table exists');
  console.log('- Verify RLS policies are enabled and working');
  console.log('- Test user signup creates default preferences');
}

// Run deployment if this script is executed directly
if (require.main === module) {
  deployDatabase().catch(console.error);
}

export { deployDatabase };
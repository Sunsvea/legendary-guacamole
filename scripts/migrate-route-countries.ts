#!/usr/bin/env tsx

/**
 * Migration script to populate country field for existing routes
 * 
 * This script processes all routes that don't have a country set,
 * detects their country using the existing country detection logic,
 * and updates the database in batches.
 * 
 * Usage: npm run migrate:countries
 */

import { getSupabaseClient } from '../src/lib/supabase';
import { detectCountryFromCoordinate } from '../src/lib/utils/country-detection';
import { DatabaseRoute } from '../src/types/database';

// Configuration
const BATCH_SIZE = 20; // Process routes in batches to avoid overwhelming the API
const DELAY_BETWEEN_BATCHES = 1000; // 1 second delay between batches
const MAX_RETRIES = 3; // Maximum retries for failed country detection

interface MigrationStats {
  total: number;
  processed: number;
  updated: number;
  failed: number;
  skipped: number;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Detect country for a route with retry logic
 */
async function detectCountryWithRetry(route: DatabaseRoute): Promise<string | null> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const country = await detectCountryFromCoordinate(route.route_data.start);
      return country;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt}/${MAX_RETRIES} failed for route ${route.id}:`, error);
      
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: wait longer between retries
        await sleep(1000 * attempt);
      }
    }
  }
  
  console.error(`Failed to detect country for route ${route.id} after ${MAX_RETRIES} attempts:`, lastError);
  return null;
}

/**
 * Update route country in database
 */
async function updateRouteCountry(supabase: any, routeId: string, country: string | null): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('routes')
      .update({ country })
      .eq('id', routeId);

    if (error) {
      console.error(`Failed to update route ${routeId}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error updating route ${routeId}:`, error);
    return false;
  }
}

/**
 * Process a batch of routes
 */
async function processBatch(supabase: any, routes: DatabaseRoute[], stats: MigrationStats): Promise<void> {
  console.log(`Processing batch of ${routes.length} routes...`);
  
  for (const route of routes) {
    stats.processed++;
    
    // Check if route has valid start coordinates
    if (!route.route_data?.start?.lat || !route.route_data?.start?.lng) {
      console.warn(`Route ${route.id} has invalid start coordinates, skipping`);
      stats.skipped++;
      continue;
    }

    // Detect country
    const country = await detectCountryWithRetry(route);
    
    // Update database
    const success = await updateRouteCountry(supabase, route.id, country);
    
    if (success) {
      stats.updated++;
      console.log(`✓ Updated route ${route.id}: ${route.name} -> ${country || 'null'}`);
    } else {
      stats.failed++;
      console.error(`✗ Failed to update route ${route.id}: ${route.name}`);
    }
    
    // Progress update
    if (stats.processed % 10 === 0) {
      console.log(`Progress: ${stats.processed}/${stats.total} routes processed`);
    }
  }
}

/**
 * Main migration function
 */
async function migrateRouteCountries(): Promise<void> {
  console.log('🚀 Starting route country migration...');
  
  const supabase = getSupabaseClient();
  const stats: MigrationStats = {
    total: 0,
    processed: 0,
    updated: 0,
    failed: 0,
    skipped: 0
  };

  try {
    // Get count of routes without country
    console.log('📊 Counting routes that need country detection...');
    const { count, error: countError } = await supabase
      .from('routes')
      .select('*', { count: 'exact', head: true })
      .is('country', null);

    if (countError) {
      throw new Error(`Failed to count routes: ${countError.message}`);
    }

    stats.total = count || 0;
    console.log(`Found ${stats.total} routes without country information`);

    if (stats.total === 0) {
      console.log('✅ No routes need country migration. All done!');
      return;
    }

    // Process routes in batches
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      // Fetch next batch of routes without country
      const { data: routes, error } = await supabase
        .from('routes')
        .select('*')
        .is('country', null)
        .order('created_at', { ascending: true })
        .range(offset, offset + BATCH_SIZE - 1);

      if (error) {
        throw new Error(`Failed to fetch routes: ${error.message}`);
      }

      if (!routes || routes.length === 0) {
        hasMore = false;
        break;
      }

      // Process this batch
      await processBatch(supabase, routes, stats);

      // Delay between batches to be gentle on the API
      if (routes.length === BATCH_SIZE) {
        console.log(`⏱️  Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await sleep(DELAY_BETWEEN_BATCHES);
      }

      offset += BATCH_SIZE;
      
      // Check if we're done
      if (routes.length < BATCH_SIZE) {
        hasMore = false;
      }
    }

    // Final report
    console.log('\n🎉 Migration completed!');
    console.log('📊 Final statistics:');
    console.log(`   Total routes: ${stats.total}`);
    console.log(`   Processed: ${stats.processed}`);
    console.log(`   Updated: ${stats.updated}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Skipped: ${stats.skipped}`);
    
    if (stats.failed > 0) {
      console.log(`\n⚠️  ${stats.failed} routes failed to update. Check the logs above for details.`);
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    console.log('\n📊 Statistics at time of failure:');
    console.log(`   Processed: ${stats.processed}/${stats.total}`);
    console.log(`   Updated: ${stats.updated}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Skipped: ${stats.skipped}`);
    
    process.exit(1);
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateRouteCountries()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}
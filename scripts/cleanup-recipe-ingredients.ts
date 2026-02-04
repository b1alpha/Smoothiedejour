/**
 * Cleanup script to fix recipes that were entered with a single long ingredient string
 * that should be split into multiple ingredients.
 * 
 * Usage:
 *   # Option 1: Set environment variables directly
 *   SUPABASE_URL=your_url SERVICE_ROLE_KEY=your_key npx tsx scripts/cleanup-recipe-ingredients.ts
 * 
 *   # Option 2: Add SERVICE_ROLE_KEY to .env.local and run:
 *   npm run cleanup:ingredients
 * 
 * To get SERVICE_ROLE_KEY:
 *   1. Go to https://supabase.com/dashboard
 *   2. Select your project (vbzmelpvugyixagfiftu)
 *   3. Go to Settings → API
 *   4. Copy the "service_role" key (NOT the anon key - this has admin privileges)
 *   5. Add to .env.local: SERVICE_ROLE_KEY=your-service-role-key
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { parseIngredients } from '../src/utils/parseIngredients.ts';

// Try to load .env.local if it exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envLocalPath = join(__dirname, '..', '.env.local');
  const envLocal = readFileSync(envLocalPath, 'utf8');
  envLocal.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
} catch {
  // .env.local doesn't exist or can't be read, that's okay
}

async function cleanupRecipes() {
  // Get Supabase URL - try multiple sources
  let supabaseUrl = process.env.SUPABASE_URL;
  
  // If not set, try to construct from VITE_SUPABASE_PROJECT_ID
  if (!supabaseUrl && process.env.VITE_SUPABASE_PROJECT_ID) {
    supabaseUrl = `https://${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`;
  }
  
  // If still not set, try VITE_SUPABASE_URL
  if (!supabaseUrl) {
    supabaseUrl = process.env.VITE_SUPABASE_URL;
  }
  
  // Get SERVICE_ROLE_KEY (required - different from anon key)
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Error: SUPABASE_URL and SERVICE_ROLE_KEY environment variables are required");
    console.error("\nYour .env.local has:");
    if (process.env.VITE_SUPABASE_PROJECT_ID) {
      console.error(`  VITE_SUPABASE_PROJECT_ID=${process.env.VITE_SUPABASE_PROJECT_ID}`);
    }
    if (process.env.VITE_SUPABASE_URL) {
      console.error(`  VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL}`);
    }
    console.error("\nTo fix:");
    console.error("  1. Add SERVICE_ROLE_KEY to .env.local");
    console.error("  2. Get it from: https://supabase.com/dashboard → Your Project → Settings → API");
    console.error("  3. Copy the 'service_role' key (NOT the anon key)");
    console.error("\nExample .env.local:");
    console.error("  VITE_SUPABASE_PROJECT_ID=vbzmelpvugyixagfiftu");
    console.error("  VITE_SUPABASE_ANON_KEY=your-anon-key");
    console.error("  SERVICE_ROLE_KEY=your-service-role-key-here");
    console.error("\nOr set directly:");
    console.error("  SUPABASE_URL=https://vbzmelpvugyixagfiftu.supabase.co SERVICE_ROLE_KEY=your_key npx tsx scripts/cleanup-recipe-ingredients.ts");
    process.exit(1);
  }

  console.log("🔍 Fetching all recipes from Supabase...");

  try {
    // Fetch all recipes using the Edge Function endpoint
    const response = await fetch(`${supabaseUrl}/functions/v1/recipes`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recipes: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const recipes = data.recipes || [];

    console.log(`📦 Found ${recipes.length} recipes`);

    let fixedCount = 0;
    let skippedCount = 0;
    const fixedRecipes: Array<{ id: string; name: string; before: string[]; after: string[] }> = [];

    for (const recipe of recipes) {
      // Check if ingredients array has only 1 element
      if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length !== 1) {
        skippedCount++;
        continue;
      }

      const singleIngredient = recipe.ingredients[0];
      
      // Try to parse it - if it results in multiple ingredients, it needs fixing
      const parsed = parseIngredients(singleIngredient);
      
      if (parsed.length > 1) {
        console.log(`\n🔧 Fixing recipe: "${recipe.name}" by ${recipe.contributor}`);
        console.log(`   Before: [${recipe.ingredients.length} ingredient]`);
        console.log(`   After:  [${parsed.length} ingredients]`);
        console.log(`   Sample: "${parsed[0]}", "${parsed[1]}", ...`);

        // Update the recipe
        const updateResponse = await fetch(`${supabaseUrl}/functions/v1/recipes/${encodeURIComponent(recipe.id)}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...recipe,
            ingredients: parsed,
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({ error: updateResponse.statusText }));
          console.error(`   ❌ Failed to update: ${errorData.error || updateResponse.statusText}`);
          continue;
        }

        fixedCount++;
        fixedRecipes.push({
          id: recipe.id,
          name: recipe.name,
          before: recipe.ingredients,
          after: parsed,
        });
      } else {
        skippedCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Summary:");
    console.log(`   Total recipes: ${recipes.length}`);
    console.log(`   Fixed: ${fixedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    
    if (fixedCount > 0) {
      console.log("\n✅ Successfully fixed recipes:");
      fixedRecipes.forEach((r, i) => {
        console.log(`   ${i + 1}. "${r.name}" (${r.before.length} → ${r.after.length} ingredients)`);
      });
    } else {
      console.log("\n✨ No recipes needed fixing!");
    }

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupRecipes();

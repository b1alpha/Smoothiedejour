/**
 * Cleanup script to fix recipes that were entered with a single long ingredient string
 * that should be split into multiple ingredients.
 * 
 * Also performs heuristic-based classification of recipes to detect:
 * - containsNuts: true if any ingredient matches nut keywords
 * - containsFat: true if any ingredient matches fat keywords
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
import { classifyIngredients, config as keywordsConfig } from '../src/utils/ingredientClassifier.ts';

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
    console.log(`🔍 Using keywords config: ${keywordsConfig.version}\n`);

    let ingredientFixCount = 0;
    let classificationFixCount = 0;
    let skippedCount = 0;
    const fixedRecipes: Array<{
      id: string;
      name: string;
      ingredientsBefore?: string[];
      ingredientsAfter?: string[];
      nutsBefore?: boolean;
      nutsAfter?: boolean;
      fatBefore?: boolean;
      fatAfter?: boolean;
    }> = [];

    for (const recipe of recipes) {
      let needsUpdate = false;
      const updatedRecipe = { ...recipe };
      const fixDetails: (typeof fixedRecipes)[number] = { id: recipe.id, name: recipe.name };

      // Get current ingredients (may need parsing)
      let ingredients: string[] = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

      // === Step 1: Fix single-ingredient parsing ===
      if (ingredients.length === 1) {
        const singleIngredient = ingredients[0];
        const parsed = parseIngredients(singleIngredient);

        if (parsed.length > 1) {
          console.log(`🔧 Splitting ingredients: "${recipe.name}" by ${recipe.contributor}`);
          console.log(`   Before: [${ingredients.length} ingredient] → After: [${parsed.length} ingredients]`);

          fixDetails.ingredientsBefore = ingredients;
          fixDetails.ingredientsAfter = parsed;
          ingredients = parsed;
          updatedRecipe.ingredients = parsed;
          needsUpdate = true;
          ingredientFixCount++;
        }
      }

      // === Step 2: Classify nuts and fat ===
      const classification = classifyIngredients(ingredients);
      const currentNuts = Boolean(recipe.containsNuts);
      const currentFat = Boolean(recipe.containsFat);

      if (classification.containsNuts !== currentNuts) {
        console.log(`🥜 Updating containsNuts: "${recipe.name}"`);
        console.log(`   ${currentNuts} → ${classification.containsNuts}`);
        if (classification.nutDetails.matchedIncludes.length > 0) {
          console.log(`   Matched: ${classification.nutDetails.matchedIncludes.slice(0, 3).join(', ')}${classification.nutDetails.matchedIncludes.length > 3 ? '...' : ''}`);
        }
        if (classification.nutDetails.matchedExcludes.length > 0) {
          console.log(`   Excludes: ${classification.nutDetails.matchedExcludes.join(', ')}`);
        }

        fixDetails.nutsBefore = currentNuts;
        fixDetails.nutsAfter = classification.containsNuts;
        updatedRecipe.containsNuts = classification.containsNuts;
        needsUpdate = true;
        if (!fixDetails.ingredientsBefore) classificationFixCount++;
      }

      if (classification.containsFat !== currentFat) {
        console.log(`🥑 Updating containsFat: "${recipe.name}"`);
        console.log(`   ${currentFat} → ${classification.containsFat}`);
        if (classification.fatDetails.matchedIncludes.length > 0) {
          console.log(`   Matched: ${classification.fatDetails.matchedIncludes.slice(0, 3).join(', ')}${classification.fatDetails.matchedIncludes.length > 3 ? '...' : ''}`);
        }
        if (classification.fatDetails.matchedExcludes.length > 0) {
          console.log(`   Excludes: ${classification.fatDetails.matchedExcludes.join(', ')}`);
        }

        fixDetails.fatBefore = currentFat;
        fixDetails.fatAfter = classification.containsFat;
        updatedRecipe.containsFat = classification.containsFat;
        needsUpdate = true;
        if (!fixDetails.ingredientsBefore && fixDetails.nutsBefore === undefined) classificationFixCount++;
      }

      // === Step 3: Update if needed ===
      if (needsUpdate) {
        const updateResponse = await fetch(`${supabaseUrl}/functions/v1/recipes/${encodeURIComponent(recipe.id)}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedRecipe),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({ error: updateResponse.statusText }));
          console.error(`   ❌ Failed to update: ${errorData.error || updateResponse.statusText}`);
          continue;
        }

        fixedRecipes.push(fixDetails);
        console.log(`   ✅ Updated successfully\n`);
      } else {
        skippedCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Summary:");
    console.log(`   Total recipes: ${recipes.length}`);
    console.log(`   Ingredient fixes: ${ingredientFixCount}`);
    console.log(`   Classification fixes: ${classificationFixCount}`);
    console.log(`   Total updated: ${fixedRecipes.length}`);
    console.log(`   Skipped (no changes): ${skippedCount}`);

    if (fixedRecipes.length > 0) {
      console.log("\n✅ Successfully updated recipes:");
      fixedRecipes.forEach((r, i) => {
        const changes: string[] = [];
        if (r.ingredientsAfter) {
          changes.push(`ingredients: ${r.ingredientsBefore?.length} → ${r.ingredientsAfter.length}`);
        }
        if (r.nutsAfter !== undefined) {
          changes.push(`nuts: ${r.nutsBefore} → ${r.nutsAfter}`);
        }
        if (r.fatAfter !== undefined) {
          changes.push(`fat: ${r.fatBefore} → ${r.fatAfter}`);
        }
        console.log(`   ${i + 1}. "${r.name}" (${changes.join(', ')})`);
      });
    } else {
      console.log("\n✨ No recipes needed updating!");
    }

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupRecipes();

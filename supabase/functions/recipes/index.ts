import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.ts';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// Health check
app.get('/recipes/health', (c) => c.json({ ok: true }));

// Update an existing recipe at /recipes/:id (MUST come before /recipes to match correctly)
// Frontend calls: PUT /functions/v1/recipes/{id}
// Supabase strips '/functions/v1' but keeps '/recipes', so function receives '/recipes/{id}'
// This matches '/recipes/:id' pattern, consistent with GET/POST using '/recipes'
app.put('/recipes/:id', async (c) => {
  try {
    const recipeId = decodeURIComponent(c.req.param('id'));
    const recipe = await c.req.json();
    
    if (!recipe.name || !recipe.contributor || !recipe.ingredients || !recipe.instructions) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if recipe exists
    const existingRecipe = await kv.get(recipeId);
    if (!existingRecipe) {
      return c.json({ error: 'Recipe not found' }, 404);
    }

    // Preserve original createdAt, update other fields
    const updatedRecipe = {
      ...existingRecipe,
      name: recipe.name,
      contributor: recipe.contributor,
      emoji: recipe.emoji || existingRecipe.emoji || '🥤',
      color: recipe.color || existingRecipe.color || '#9333EA',
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      servings: recipe.servings || existingRecipe.servings || 1,
      prepTime: recipe.prepTime || existingRecipe.prepTime || '5 min',
      containsFat: recipe.containsFat ?? existingRecipe.containsFat ?? false,
      containsNuts: recipe.containsNuts ?? existingRecipe.containsNuts ?? false,
    };

    await kv.set(recipeId, updatedRecipe);
    return c.json({ success: true, recipe: updatedRecipe });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return c.json({ error: 'Failed to update recipe' }, 500);
  }
});

// List community recipes at /recipes
app.get('/recipes', async (c) => {
  try {
    const recipes = await kv.getByPrefix('recipe:');
    return c.json({ recipes: recipes || [] });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return c.json({ error: 'Failed to fetch recipes' }, 500);
  }
});

// Create a new recipe at /recipes
app.post('/recipes', async (c) => {
  try {
    const recipe = await c.req.json();
    if (!recipe.name || !recipe.contributor || !recipe.ingredients || !recipe.instructions) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const recipeId = `recipe:${Date.now()}:${Math.random().toString(36).substring(7)}`;
    const newRecipe = {
      id: recipeId,
      name: recipe.name,
      contributor: recipe.contributor,
      emoji: recipe.emoji || '🥤',
      color: recipe.color || '#9333EA',
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      servings: recipe.servings || 1,
      prepTime: recipe.prepTime || '5 min',
      containsFat: recipe.containsFat || false,
      containsNuts: recipe.containsNuts || false,
      createdAt: new Date().toISOString(),
    };

    await kv.set(recipeId, newRecipe);
    return c.json({ success: true, recipe: newRecipe });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return c.json({ error: 'Failed to create recipe' }, 500);
  }
});

Deno.serve(app.fetch);

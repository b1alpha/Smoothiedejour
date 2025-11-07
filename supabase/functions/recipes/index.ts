import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.ts';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// Health check
app.get('/health', (c) => c.json({ ok: true }));

// List community recipes
app.get('/', async (c) => {
  try {
    const recipes = await kv.getByPrefix('recipe:');
    return c.json({ recipes: recipes || [] });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return c.json({ error: 'Failed to fetch recipes' }, 500);
  }
});

// Create a new recipe
app.post('/', async (c) => {
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

// Catch-all to help debug path/method issues
app.all('*', (c) => c.json({ ok: true, path: c.req.path, method: c.req.method }));

Deno.serve(app.fetch);



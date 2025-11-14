
export interface CommunityRecipe {
  id: string;
  name: string;
  contributor: string;
  emoji: string;
  color: string;
  ingredients: string[];
  instructions: string;
  servings: number;
  prepTime: string;
  containsFat: boolean;
  containsNuts: boolean;
  createdAt?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const envProjectId = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID as string | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const envAnon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

// Support local development: if VITE_SUPABASE_URL points to localhost, use it directly
// Otherwise, construct the URL from project ID or use the provided URL
const baseUrl = envUrl
  ? `${envUrl}/functions/v1/recipes`
  : `https://${envProjectId}.supabase.co/functions/v1/recipes`;

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  apikey: envAnon ?? '',
  Authorization: `Bearer ${envAnon ?? ''}`,
};

export async function fetchCommunityRecipes(): Promise<CommunityRecipe[]> {
  try {
    const res = await fetch(baseUrl, {
      method: 'GET',
      headers: defaultHeaders,
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch recipes: ${res.status}`);
    }
    const json = await res.json();
    return json.recipes ?? [];
  } catch (error) {
    // Check if it's a connection refused error (localhost not running)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const isLocalhost = baseUrl.includes('localhost');
      if (isLocalhost && import.meta.env.DEV) {
        console.warn('⚠️ Local Supabase instance not running. Connection refused to:', baseUrl);
        console.warn('💡 To start local Supabase:');
        console.warn('   1. Start Supabase: supabase start');
        console.warn('   2. Start Edge Functions: supabase functions serve recipes');
        console.warn('   Or use production by removing .env.local');
      }
    }
    throw error;
  }
}

export async function submitCommunityRecipe(recipe: Omit<CommunityRecipe, 'id' | 'createdAt'>): Promise<CommunityRecipe> {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(recipe),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to submit recipe: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json.recipe;
}

export async function updateCommunityRecipe(
  recipeId: string,
  recipe: Omit<CommunityRecipe, 'id' | 'createdAt'>
): Promise<CommunityRecipe> {
  const encodedRecipeId = encodeURIComponent(recipeId);
  // Route is /recipes/:id
  // Frontend: PUT /functions/v1/recipes/{id}
  // Supabase strips '/functions/v1' but keeps '/recipes', so function receives '/recipes/{id}'
  // baseUrl = /functions/v1/recipes, so we call: /functions/v1/recipes/{id}
  // This matches the backend route '/recipes/:id'
  const res = await fetch(`${baseUrl}/${encodedRecipeId}`, {
    method: 'PUT',
    headers: defaultHeaders,
    body: JSON.stringify(recipe),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update recipe: ${res.status} ${text}`);
  }
  const json = await res.json();
  return json.recipe;
}



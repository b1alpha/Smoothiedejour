import { projectId as fallbackProjectId, publicAnonKey as fallbackAnonKey } from './info';

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

const envProjectId = (import.meta as any).env?.VITE_SUPABASE_PROJECT_ID as string | undefined;
const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const envAnon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

const resolvedProjectId = envProjectId || fallbackProjectId;
const resolvedAnonKey = envAnon || fallbackAnonKey;

const baseUrl = envUrl
  ? `${envUrl}/functions/v1/server/make-server-9f7fc7bb/recipes`
  : `https://${resolvedProjectId}.supabase.co/functions/v1/server/make-server-9f7fc7bb/recipes`;

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  apikey: resolvedAnonKey,
  Authorization: `Bearer ${resolvedAnonKey}`,
};

export async function fetchCommunityRecipes(): Promise<CommunityRecipe[]> {
  const res = await fetch(baseUrl, {
    method: 'GET',
    headers: defaultHeaders,
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch recipes: ${res.status}`);
  }
  const json = await res.json();
  return json.recipes ?? [];
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



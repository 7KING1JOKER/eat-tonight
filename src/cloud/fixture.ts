import type { Ingredient, Recipe } from '@/types/eat'

interface SeedRecipe {
  id: string
  name: string
  need: string[]
  steps: string[]
}

/**
 * 云环境还没开通时，把仓库里的种子 JSON 写进缓存形状。
 * 页面不要直接 import JSON。设置了 CLOUD_ENV_ID 之后，调用方不应再走这里。
 */
export async function readSeedBundle(): Promise<{ ingredients: Ingredient[]; recipes: Recipe[] }> {
  const ingredientsMod = await import('../../data/ingredients.json')
  const recipesMod = await import('../../data/recipes.json')
  const ingredients = ingredientsMod.default as Ingredient[]
  const recipes = (recipesMod.default as SeedRecipe[]).map((row) => ({
    ...row,
    source: 'official' as const,
  }))
  return { ingredients, recipes }
}

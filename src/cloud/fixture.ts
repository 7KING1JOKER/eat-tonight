import type { Ingredient, Recipe, RecipeCredit, RecipeItem } from '@/types/eat'
import ingredientsJson from '../../data/ingredients.json'
import recipesJson from '../../data/recipes.json'

interface SeedRecipe {
  id: string
  name: string
  need: string[]
  steps: string[]
  summary?: string
  servings?: string
  note?: string
  items?: RecipeItem[]
  credit?: RecipeCredit
}

/**
 * 云环境还没开通时，把仓库里的种子 JSON 写进缓存形状。
 * 页面不要直接 import JSON。设置了 CLOUD_ENV_ID 之后，调用方不应再走这里。
 */
export async function readSeedBundle(): Promise<{ ingredients: Ingredient[]; recipes: Recipe[] }> {
  const ingredients = ingredientsJson as Ingredient[]
  const recipes = (recipesJson as SeedRecipe[]).map((row) => ({
    ...row,
    source: 'official' as const,
  }))
  return { ingredients, recipes }
}

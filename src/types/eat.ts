export type RecipeSource = 'official' | 'mine'

export interface Recipe {
  id: string
  name: string
  need: string[]
  steps: string[]
  source: RecipeSource
}

export interface Matched extends Recipe {
  missing: string[]
}

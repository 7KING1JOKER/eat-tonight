export type RecipeSource = 'official' | 'mine'

export interface Ingredient {
  id: string
  name: string
  group: string
}

/** 用户自己加的食材。id 以 `c_` 开头，只出现在冰箱和「我的菜」里。 */
export interface CustomIngredient {
  id: string
  name: string
}

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

/**
 * 冰箱在本地和云上的形状。
 * `pendingSync` 为真表示上次写云失败，冷启动时不要用云端旧数据盖掉本地勾选。
 */
export interface FridgeState {
  have: string[]
  custom: CustomIngredient[]
  pendingSync: boolean
}


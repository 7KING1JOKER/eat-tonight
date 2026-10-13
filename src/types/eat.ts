export type RecipeSource = 'official' | 'mine'

/** 官方食材。编号是 `o_` 加名字，例如 `o_鸡蛋`。 */
export interface Ingredient {
  id: string
  name: string
  group: string
}

/** 用户自己加的食材。id 是 `c_` 加随机字符，和名字分开。只出现在冰箱和「我的菜」里。 */
export interface CustomIngredient {
  id: string
  name: string
}

/** 菜谱页上的一条用料。`id` 能对上冰箱时才写；水、喷油这类不进冰箱。 */
export interface RecipeItem {
  id?: string
  name: string
  amount: string
  note?: string
}

/** 菜谱网页出处。字段都用中文，网址除外。 */
export interface RecipeCredit {
  site: string
  recipeBy: string
  url: string
  license: string
}

export interface Recipe {
  id: string
  name: string
  need: string[]
  steps: string[]
  source: RecipeSource
  /** 菜谱页上的简介。页面没有就不写。 */
  summary?: string
  /** 页面上的份量。页面没有就不写。 */
  servings?: string
  /** 页面上的小贴士，或转写时必须说明的差异。 */
  note?: string
  /** 带用量的全部用料，给详情页看。匹配仍只用 `need`。 */
  items?: RecipeItem[]
  credit?: RecipeCredit
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


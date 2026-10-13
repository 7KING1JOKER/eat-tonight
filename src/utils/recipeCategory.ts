import type { Recipe } from '@/types/eat'

const FOLDER_LABEL: Record<string, string> = {
  meat_dish: '荤菜',
  vegetable_dish: '素菜',
  aquatic: '水产',
  staple: '主食',
  soup: '汤羹',
  breakfast: '早餐',
  dessert: '甜品',
  drink: '饮品',
  condiment: '调味',
  'semi-finished': '半成品',
}

export const CATEGORY_ORDER = [
  '荤菜',
  '素菜',
  '水产',
  '主食',
  '汤羹',
  '早餐',
  '甜品',
  '饮品',
  '调味',
  '半成品',
  '我的',
  '其他',
]

/** 官方菜按出处网址里的目录归类。我的菜单独一类。 */
export function recipeCategory(recipe: Pick<Recipe, 'source' | 'credit'>): string {
  if (recipe.source === 'mine') return '我的'
  const url = recipe.credit?.url ?? ''
  const folder = url.match(/\/dishes\/([^/]+)\//)?.[1] ?? ''
  return FOLDER_LABEL[folder] ?? '其他'
}

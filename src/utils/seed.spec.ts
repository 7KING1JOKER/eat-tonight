import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Ingredient, Recipe, RecipeCredit, RecipeItem } from '../types/eat'
import { matchRecipes } from './match.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

interface SeedRecipe {
  id: string
  name: string
  need: string[]
  steps: string[]
  items?: RecipeItem[]
  credit?: RecipeCredit
}

/**
 * 读取种子菜谱，并补上运行时才有的 `source: 'official'`。
 * JSON 本身不写 source，导入云库时同样在写入前补上。
 * @returns 可直接交给 `matchRecipes` 的官方菜列表
 */
function loadRecipes(): Recipe[] {
  const raw = JSON.parse(readFileSync(path.join(root, 'data/recipes.json'), 'utf8')) as SeedRecipe[]
  return raw.map((row) => ({ ...row, source: 'official' as const }))
}

describe('seed recipes', () => {
  it('每道菜都有菜谱网页、用量和步骤', () => {
    const recipes = loadRecipes()
    const ingredients = JSON.parse(readFileSync(path.join(root, 'data/ingredients.json'), 'utf8')) as Ingredient[]
    const ids = new Set(ingredients.map((item) => item.id))
    expect(ingredients.length).toBeGreaterThanOrEqual(200)
    expect(ingredients.every((item) => item.id === `o_${item.name}`)).toBe(true)
    expect(recipes.length).toBeGreaterThanOrEqual(345)
    for (const row of recipes) {
      expect(row.need.length).toBeGreaterThanOrEqual(1)
      expect(row.need.every((id) => ids.has(id))).toBe(true)
      expect(row.steps.length).toBeGreaterThanOrEqual(1)
      expect(row.steps.every((step) => step.length > 0)).toBe(true)
      expect(row.credit?.site).toBe('程序员做饭指南')
      expect(row.credit?.recipeBy?.length).toBeGreaterThan(0)
      expect(row.credit?.license?.length).toBeGreaterThan(0)
      expect(row.credit?.url.startsWith('https://')).toBe(true)
      expect(row.items?.length).toBeGreaterThan(0)
      for (const item of row.items ?? []) {
        expect(item.name.length).toBeGreaterThan(0)
        expect(item.amount.length).toBeGreaterThan(0)
        if (item.id) expect(ids.has(item.id)).toBe(true)
      }
    }
  })

  it('鸡蛋、番茄和调味都齐才算出西红柿炒鸡蛋，水不参与匹配', () => {
    const recipes = loadRecipes()
    const ingredients = JSON.parse(readFileSync(path.join(root, 'data/ingredients.json'), 'utf8')) as Ingredient[]
    expect(ingredients.some((item) => item.id === 'o_水')).toBe(false)
    const egg = recipes.find((row) => row.id === 'h6ce66be9')
    expect(egg?.need).toEqual(['o_番茄', 'o_鸡蛋', 'o_食用油', 'o_盐', 'o_白糖'])
    const full = matchRecipes(egg?.need ?? [], recipes)
    expect(full.ready.map((row) => row.id)).toContain('h6ce66be9')
    const almost = matchRecipes((egg?.need ?? []).filter((id) => id !== 'o_盐'), recipes)
    expect(almost.almost.map((row) => row.id)).toContain('h6ce66be9')
    const onlyEgg = matchRecipes(['o_鸡蛋'], recipes)
    expect(onlyEgg.ready.concat(onlyEgg.almost).map((row) => row.id)).not.toContain('h6ce66be9')
    const empty = matchRecipes([], recipes)
    expect(empty.ready).toEqual([])
    expect(empty.almost).toEqual([])
    const drink = recipes.find((row) => row.id === 'h222cfe9d')
    expect(drink?.need).not.toContain('o_水')
    expect(drink?.items?.some((item) => item.id === 'o_水')).toBe(false)
    const near = matchRecipes((drink?.need ?? []).filter((id) => id !== 'o_蜂蜜'), recipes)
    expect(near.almost.map((row) => row.id)).toContain('h222cfe9d')
    const onlyPassion = matchRecipes(['o_百香果'], recipes)
    const shown = onlyPassion.ready.concat(onlyPassion.almost)
    expect(shown.every((row) => row.need.includes('o_百香果'))).toBe(true)
  })
})

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { Recipe } from '../types/eat'
import { matchRecipes } from './match.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

interface SeedRecipe {
  id: string
  name: string
  need: string[]
  steps: string[]
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
  it('每道菜 need 都非空，导入时可补 source', () => {
    const recipes = loadRecipes()
    expect(recipes.length).toBeGreaterThanOrEqual(8)
    expect(recipes.every((row) => row.need.length > 0)).toBe(true)
  })

  it('鸡蛋+番茄能做出番茄炒蛋，空冰箱不出现可乐鸡翅', () => {
    const recipes = loadRecipes()
    const full = matchRecipes(['egg', 'tomato'], recipes)
    expect(full.ready.map((row) => row.id)).toContain('tomato-egg')
    const empty = matchRecipes([], recipes)
    expect(empty.ready.concat(empty.almost).map((row) => row.id)).not.toContain('cola-wing')
  })
})

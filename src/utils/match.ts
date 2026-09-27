import type { Matched, Recipe } from '@/types/eat'

export type { Recipe, Matched } from '@/types/eat'

function missingOf(need: string[], have: Set<string>): string[] {
  return need.filter((id) => !have.has(id))
}

function rank(a: Matched, b: Matched): number {
  const byMiss = a.missing.length - b.missing.length
  if (byMiss !== 0) return byMiss
  const byNeed = a.need.length - b.need.length
  if (byNeed !== 0) return byNeed
  if (a.source !== b.source) return a.source === 'official' ? -1 : 1
  return a.name.localeCompare(b.name, 'zh')
}

export function matchRecipes(
  have: string[],
  recipes: Recipe[],
): { ready: Matched[]; almost: Matched[] } {
  const haveSet = new Set(have)
  const ready: Matched[] = []
  const almost: Matched[] = []
  for (const recipe of recipes) {
    if (recipe.need.length === 0) continue
    const missing = missingOf(recipe.need, haveSet)
    const n = missing.length
    const row: Matched = { ...recipe, missing }
    if (n === 0) ready.push(row)
    else if (n === 1 || n === 2) almost.push(row)
  }
  ready.sort(rank)
  almost.sort(rank)
  return { ready, almost }
}

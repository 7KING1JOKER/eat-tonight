import type { Matched, Recipe } from '../types/eat'

export type { Matched, Recipe }

/**
 * 算出一道菜还缺哪些食材。顺序与 `need` 一致，方便卡片按用料顺序展示。
 * @param need 这道菜需要的食材 id
 * @param have 冰箱里已有的食材 id
 * @returns `need` 中不在 `have` 里的 id
 */
function missingOf(need: string[], have: Set<string>): string[] {
  return need.filter((id) => !have.has(id))
}

/**
 * 同一组内的排序：缺得更少的在前；缺料数相同则用料更短的在前；
 * 再相同则官方菜在「我的菜」前；最后按中文菜名。
 * @param a 已算出 missing 的菜
 * @param b 已算出 missing 的菜
 * @returns 小于 0 则 a 在前，大于 0 则 b 在前
 */
function rank(a: Matched, b: Matched): number {
  const byMiss = a.missing.length - b.missing.length
  if (byMiss !== 0) return byMiss
  const byNeed = a.need.length - b.need.length
  if (byNeed !== 0) return byNeed
  if (a.source !== b.source) return a.source === 'official' ? -1 : 1
  return a.name.localeCompare(b.name, 'zh')
}

/**
 * 按冰箱现有食材把菜分成两组。缺 0 样进 `ready`。
 * 缺 1 或 2 样、并且冰箱里已经有这道菜的至少一样食材，才进 `almost`。
 * 缺 3 样及以上、`need` 为空、或冰箱里一样都没有的菜，直接丢掉。
 * @param have 已有食材 id，重复项无影响
 * @param recipes 官方菜和我的菜，调用前拼好
 * @returns `ready` 今晚能做，`almost` 还差 1～2 样
 */
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
    const owned = recipe.need.length - n
    const row: Matched = { ...recipe, missing }
    if (n === 0) ready.push(row)
    else if ((n === 1 || n === 2) && owned >= 1) almost.push(row)
  }
  ready.sort(rank)
  almost.sort(rank)
  return { ready, almost }
}

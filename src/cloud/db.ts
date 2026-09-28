import type { CustomIngredient, Ingredient, Recipe, RecipeSource } from '@/types/eat'
import { hasCloudEnv } from './env'

interface CloudDoc {
  _id?: string
  id?: string
  name?: string
  group?: string
  need?: string[]
  steps?: string[]
  source?: RecipeSource
  have?: string[]
  custom?: CustomIngredient[]
  ownerId?: string
}

interface CloudQuery {
  get(): Promise<{ data: CloudDoc | CloudDoc[] }>
  update(options: { data: Record<string, unknown> }): Promise<unknown>
  set(options: { data: Record<string, unknown> }): Promise<unknown>
  remove(): Promise<unknown>
}

interface CloudCollection {
  limit(n: number): { get(): Promise<{ data: CloudDoc[] }> }
  doc(id: string): CloudQuery
  where(query: Record<string, unknown>): CloudCollection
  add(options: { data: Record<string, unknown> }): Promise<unknown>
}

interface WxDatabase {
  collection(name: string): CloudCollection
}

/** 当前环境的云数据库。没有 wx.cloud 或未配置环境 ID 时抛错，由 composable 捕获。 */
function database(): WxDatabase {
  const host = globalThis as { wx?: { cloud?: { database?: () => WxDatabase } } }
  const db = host.wx?.cloud?.database?.()
  if (!db || !hasCloudEnv()) {
    throw new Error('云数据库不可用')
  }
  return db
}

/** 官方食材全量读取。集合不大，不分页。 */
export async function fetchIngredients(): Promise<Ingredient[]> {
  const res = await database().collection('ingredients').limit(100).get()
  return res.data
    .filter((row) => row.id && row.name)
    .map((row) => ({
      id: String(row.id),
      name: String(row.name),
      group: String(row.group || '其他'),
    }))
}

/**
 * 官方菜谱全量读取。库里可以不存 source，读出来一律标成 official。
 * 空 need 留给 matchRecipes 丢掉，这里不改写规则。
 */
export async function fetchOfficialRecipes(): Promise<Recipe[]> {
  const res = await database().collection('recipes').limit(100).get()
  return res.data
    .filter((row) => row.id && row.name)
    .map((row) => ({
      id: String(row.id),
      name: String(row.name),
      need: row.need ?? [],
      steps: row.steps ?? [],
      source: 'official' as const,
    }))
}

/** 读取某个用户的冰箱。文档不存在时抛错，调用方保留本地勾选。 */
export async function getFridge(openid: string): Promise<{ have: string[]; custom: CustomIngredient[] }> {
  const res = await database().collection('fridges').doc(openid).get()
  const doc = (Array.isArray(res.data) ? res.data[0] : res.data) ?? {}
  return {
    have: doc.have ?? [],
    custom: doc.custom ?? [],
  }
}

/**
 * 覆盖写入冰箱。文档不存在时改为 set。
 * custom 是可选的自定义食材名，匹配只用其中的 id。
 */
export async function setFridge(
  openid: string,
  have: string[],
  custom: CustomIngredient[] = [],
): Promise<void> {
  const doc = database().collection('fridges').doc(openid)
  const data = { have, custom }
  try {
    await doc.update({ data })
  } catch {
    await doc.set({ data })
  }
}

/** 读取当前用户的自建菜，并标成 mine。 */
export async function fetchMyRecipes(openid: string): Promise<Recipe[]> {
  const res = await database().collection('my_recipes').where({ ownerId: openid }).limit(100).get()
  return res.data
    .filter((row) => row.id && row.name)
    .map((row) => ({
      id: String(row.id),
      name: String(row.name),
      need: row.need ?? [],
      steps: row.steps ?? [],
      source: 'mine' as const,
    }))
}

/** 按业务 id 新增或覆盖一道我的菜。云规则用 ownerId 限制本人。 */
export async function upsertMyRecipe(recipe: Recipe & { ownerId: string }): Promise<void> {
  const col = database().collection('my_recipes')
  const found = await col.where({ id: recipe.id, ownerId: recipe.ownerId }).limit(1).get()
  const data = {
    id: recipe.id,
    name: recipe.name,
    need: recipe.need,
    steps: recipe.steps,
    source: 'mine' as const,
    ownerId: recipe.ownerId,
  }
  const existing = found.data[0]
  if (existing?._id) {
    await col.doc(existing._id).update({ data })
    return
  }
  await col.add({ data })
}

/** 按业务 id 删除我的菜。删不到文档时抛错。 */
export async function removeMyRecipe(id: string, ownerId: string): Promise<void> {
  const col = database().collection('my_recipes')
  const found = await col.where({ id, ownerId }).limit(1).get()
  const existing = found.data[0]
  if (!existing?._id) throw new Error('没有这道菜')
  await col.doc(existing._id).remove()
}

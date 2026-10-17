import type { CustomIngredient, Ingredient, Recipe, RecipeCredit, RecipeItem, RecipeSource } from '@/types/eat'
import type { JournalEvent } from '@/utils/journal'
import { hasCloudEnv } from './env'

/** 云上一条文档的字段。只列本文件会读到的键，没有的字段都是可选。这是编译期类型，里面不存数据。 */
interface CloudDoc {
  _id?: string
  id?: string
  name?: string
  group?: string
  need?: string[]
  steps?: string[]
  source?: RecipeSource
  summary?: string
  servings?: string
  note?: string
  items?: RecipeItem[]
  credit?: RecipeCredit
  have?: string[]
  custom?: CustomIngredient[]
  ownerId?: string
  events?: JournalEvent[]
}

/**
 * `collection().doc(id)` 定位到的一条文档。
 * `get` 读取，`update` 改已有文档，`set` 整份写入（文档不存在时用），`remove` 删除。
 */
interface CloudQuery {
  get(): Promise<{ data: CloudDoc | CloudDoc[] }>
  update(options: { data: Record<string, unknown> }): Promise<unknown>
  set(options: { data: Record<string, unknown> }): Promise<unknown>
  remove(): Promise<unknown>
}

/**
 * `database().collection(集合名)` 返回的一张集合，例如 ingredients、fridges。
 * 只声明本文件用到的方法，让后面的调用通过类型检查。运行时仍是微信云数据库，这个接口不代替真库。
 */
interface CloudPage {
  skip(n: number): CloudPage
  limit(n: number): CloudPage
  get(): Promise<{ data: CloudDoc[] }>
}

interface CloudCollection {
  limit(n: number): CloudPage
  skip(n: number): CloudPage
  doc(id: string): CloudQuery
  where(query: Record<string, unknown>): CloudCollection
  add(options: { data: Record<string, unknown> }): Promise<unknown>
}

/** `wx.cloud.database()` 的返回值。`collection` 按名字取出上面的一张集合。 */
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

/** 小程序端单次最多取 20 条，这里翻页读完。 */
async function fetchAll(name: string): Promise<CloudDoc[]> {
  const pageSize = 20
  const rows: CloudDoc[] = []
  for (let skip = 0; skip < 5000; skip += pageSize) {
    const res = await database().collection(name).skip(skip).limit(pageSize).get()
    const batch = res.data ?? []
    rows.push(...batch)
    if (batch.length < pageSize) break
  }
  return rows
}

/** 官方食材全量读取。 */
export async function fetchIngredients(): Promise<Ingredient[]> {
  const res = await fetchAll('ingredients')
  return res
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
  const res = await fetchAll('recipes')
  return res
    .filter((row) => row.id && row.name)
    .map((row) => ({
      id: String(row.id),
      name: String(row.name),
      need: row.need ?? [],
      steps: row.steps ?? [],
      source: 'official' as const,
      ...citedFields(row),
    }))
}

/** 云文档里多出来的出处和用料。没有这些字段时不补空对象。 */
function citedFields(row: CloudDoc): Partial<Recipe> {
  const extra: Partial<Recipe> = {}
  if (row.summary) extra.summary = row.summary
  if (row.servings) extra.servings = row.servings
  if (row.note) extra.note = row.note
  if (row.items?.length) extra.items = row.items
  if (row.credit?.url && row.credit.site && row.credit.recipeBy && row.credit.license) extra.credit = row.credit
  return extra
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
      ...citedFields(row),
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
    summary: recipe.summary ?? '',
    servings: recipe.servings ?? '',
    note: recipe.note ?? '',
    items: recipe.items ?? [],
    credit: recipe.credit ?? { site: '', recipeBy: '', url: '', license: '' },
  }
  const existing = found.data[0]
  if (existing?._id) {
    await col.doc(existing._id).update({ data })
    return
  }
  await col.add({ data })
}

/** 读取某个用户的习惯记录。文档不存在时抛错，调用方保留本地记录。 */
export async function getJournal(openid: string): Promise<JournalEvent[]> {
  const res = await database().collection('journals').doc(openid).get()
  const doc = (Array.isArray(res.data) ? res.data[0] : res.data) ?? {}
  return doc.events ?? []
}

/**
 * 覆盖写入习惯记录。文档不存在时改为 set。
 * 集合与冰箱相同，只有本人可读写。不在这里创建集合。
 */
export async function setJournal(openid: string, events: JournalEvent[]): Promise<void> {
  const doc = database().collection('journals').doc(openid)
  const data = { events }
  try {
    await doc.update({ data })
  } catch {
    await doc.set({ data })
  }
}

/** 按业务 id 删除我的菜。删不到文档时抛错。 */
export async function removeMyRecipe(id: string, ownerId: string): Promise<void> {
  const col = database().collection('my_recipes')
  const found = await col.where({ id, ownerId }).limit(1).get()
  const existing = found.data[0]
  if (!existing?._id) throw new Error('没有这道菜')
  await col.doc(existing._id).remove()
}

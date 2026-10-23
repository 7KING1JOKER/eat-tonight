import dayjs from 'dayjs'

export type JournalKind = 'fridge' | 'view' | 'create'

/** 一条习惯记录。调用方按时间先后追加，数组越往后 `at` 越大。 */
export interface JournalEvent {
  at: number // 发生时间，毫秒时间戳。
  kind: JournalKind // `fridge` 勾选，`view` 看菜，`create` 新建菜。
  id: string // 食材 id 或菜谱 id，不是这条记录自己的编号。
  name: string // 当时的食材名或菜名。
  source?: 'official' | 'mine' // 看菜、新建时标明官方菜还是我的菜。
  delta?: 'on' | 'off' // 仅冰箱勾选：`on` 勾上，`off` 取消或清空。
}

/** `summarizeJournal` 交给「我的」页的五块内容。 */
export interface JournalView {
  days: { date: string; on: string[]; off: string[] }[] // 最近 7 天的勾上与取消，新的日期在前，每天每侧最多 8 个名字。
  recentViews: { at: number; id: string; name: string; source?: 'official' | 'mine' }[] // 最近看过的菜，最多 8 条，新的在前。
  created: { at: number; id: string; name: string }[] // 这 30 天里新建的菜，最多 8 条，新的在前。
  frequentRecipes: { id: string; name: string; count: number }[] // 浏览次数前 3 的菜。
  frequentIngredients: { id: string; name: string; count: number }[] // 勾上次数前 5 的食材。
}

/**
 * 追加一条记录。不修改入参。
 * 同一道菜连续两次 `view` 相隔不到 60 秒时，用新的替换最后一条。
 * 结果超过 400 条时丢掉更早的，只留末尾。
 * @param events 已按 `at` 从小到大排好的记录
 * @param event 新记录，`at` 不小于最后一条
 * @returns 新的记录数组
 */
export function appendJournal(events: JournalEvent[], event: JournalEvent): JournalEvent[] {
  const next = events.slice()
  const last = next[next.length - 1]
  const repeatView =
    event.kind === 'view' &&
    last?.kind === 'view' &&
    last.id === event.id &&
    event.at >= last.at &&
    event.at - last.at < 60_000
  if (repeatView) next[next.length - 1] = event
  else next.push(event)
  return next.length > 400 ? next.slice(next.length - 400) : next
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000

/**
 * 按次数取前几名。次数相同则更近的一次在前。
 * @param events 已经落在时间窗里的同类记录
 * @param limit 最多留下几条
 */
function topCounts(events: JournalEvent[], limit: number): JournalView['frequentRecipes'] {
  const byId = new Map<string, { id: string; name: string; count: number; at: number }>()
  for (const event of events) {
    const row = byId.get(event.id) ?? { id: event.id, name: event.name, count: 0, at: event.at }
    row.count += 1
    row.name = event.name
    if (event.at > row.at) row.at = event.at
    byId.set(event.id, row)
  }
  return [...byId.values()]
    .sort((a, b) => b.count - a.count || b.at - a.at)
    .slice(0, limit)
    .map(({ id, name, count }) => ({ id, name, count }))
}

/**
 * 把记录收成「我的」页的五块。不修改入参。
 * 只用 `now` 往前 30 天、且不晚于 `now` 的记录。
 * @param events 已按 `at` 从小到大排好的记录
 * @param now 汇总时刻的毫秒时间戳
 * @returns 冰箱最近 7 天（每天勾上、取消各最多 8 个名字）、最近浏览 8 条、新建 8 条、常看 3、常勾 5
 */
export function summarizeJournal(events: JournalEvent[], now: number): JournalView {
  // 只用 `now` 往前 30 天、且不晚于 `now` 的记录。
  const windowed = events.filter((event) => event.at <= now && event.at >= now - MONTH_MS)
  const days: JournalView['days'] = []
  for (const event of windowed) {
    // 只用冰箱勾选 
    if (event.kind !== 'fridge' || (event.delta !== 'on' && event.delta !== 'off')) continue
    const date = dayjs(event.at).format('YYYY-MM-DD')
    // 日期分组，如果没有则创建
    const row = days.find((item) => item.date === date) ?? { date, on: [], off: [] }
    if (!days.includes(row)) days.push(row)
    // 勾选状态分组，如果没有则创建
    const names = event.delta === 'on' ? row.on : row.off
    if (!names.includes(event.name)) names.push(event.name)
  }
  // 最近看过的菜
  const views = windowed.filter((event) => event.kind === 'view')
  return {
    days: days
      .reverse()
      .slice(0, 7)
      .map((row) => ({ ...row, on: row.on.slice(0, 8), off: row.off.slice(0, 8) })),
    recentViews: views.slice(-8).reverse().map(({ at, id, name, source }) => ({ at, id, name, source })),
    created: windowed
      .filter((event) => event.kind === 'create')
      .reverse()
      .slice(0, 8)
      .map(({ at, id, name }) => ({ at, id, name })),
    frequentRecipes: topCounts(views, 3),
    frequentIngredients: topCounts(
      windowed.filter((event) => event.kind === 'fridge' && event.delta === 'on'),
      5,
    ),
  }
}
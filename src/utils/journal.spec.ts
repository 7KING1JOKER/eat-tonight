import { describe, expect, it } from 'vitest'
import { appendJournal, summarizeJournal, type JournalEvent } from './journal.js'

const MONTH_MS = 30 * 24 * 60 * 60 * 1000

function at(year: number, month: number, day: number, hour = 12, minute = 0): number {
  return new Date(year, month - 1, day, hour, minute).getTime()
}

function localDay(timestamp: number): string {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

describe('appendJournal', () => {
  it('超过 400 条时丢掉最旧的，并且不改入参', () => {
    const events: JournalEvent[] = Array.from({ length: 400 }, (_, index) => ({
      at: index,
      kind: 'fridge',
      id: `id-${index}`,
      name: `食材${index}`,
      delta: 'on',
    }))
    const added: JournalEvent = { at: 400, kind: 'fridge', id: 'new', name: '新的', delta: 'on' }
    const next = appendJournal(events, added)
    expect(next).toHaveLength(400)
    expect(next[0]?.id).toBe('id-1')
    expect(next[399]?.id).toBe('new')
    expect(events).toHaveLength(400)
    expect(events[0]?.id).toBe('id-0')
  })

  it('同一道菜连续两次浏览相隔不到 60 秒时只留后一条', () => {
    const first: JournalEvent = { at: 1_000, kind: 'view', id: 'r1', name: '番茄炒蛋', source: 'official' }
    const second: JournalEvent = { at: 1_000 + 59_999, kind: 'view', id: 'r1', name: '番茄炒蛋', source: 'official' }
    const next = appendJournal([first], second)
    expect(next).toEqual([second])
    expect(next[0]).not.toBe(first)
  })

  it('间隔刚好 60 秒，或中间夹了别的记录时，两条都留', () => {
    const first: JournalEvent = { at: 1_000, kind: 'view', id: 'r1', name: '番茄炒蛋', source: 'official' }
    const later: JournalEvent = { at: 1_000 + 60_000, kind: 'view', id: 'r1', name: '番茄炒蛋', source: 'official' }
    expect(appendJournal([first], later)).toEqual([first, later])

    const other: JournalEvent = { at: 2_000, kind: 'view', id: 'r2', name: '可乐鸡翅', source: 'official' }
    const again: JournalEvent = { at: 3_000, kind: 'view', id: 'r1', name: '番茄炒蛋', source: 'official' }
    expect(appendJournal([first, other], again)).toEqual([first, other, again])
  })
})

describe('summarizeJournal', () => {
  it('早于 30 天的勾选不进常用食材，刚好卡在边界上的算进去', () => {
    const now = at(2026, 10, 16)
    const tooOld: JournalEvent = {
      at: now - MONTH_MS - 1,
      kind: 'fridge',
      id: 'o_姜',
      name: '姜',
      delta: 'on',
    }
    const edge: JournalEvent = {
      at: now - MONTH_MS,
      kind: 'fridge',
      id: 'o_鸡蛋',
      name: '鸡蛋',
      delta: 'on',
    }
    const view = summarizeJournal([tooOld, edge], now)
    expect(view.frequentIngredients).toEqual([{ id: 'o_鸡蛋', name: '鸡蛋', count: 1 }])
    expect(view.days.map((row) => row.date)).toEqual([localDay(edge.at)])
  })

  it('清空拆成的多条取消出现在同一天，顺序按第一次出现', () => {
    const morning = at(2026, 10, 16, 8)
    const again = at(2026, 10, 16, 9)
    const events: JournalEvent[] = [
      { at: morning, kind: 'fridge', id: 'o_鸡蛋', name: '鸡蛋', delta: 'off' },
      { at: morning + 1, kind: 'fridge', id: 'o_番茄', name: '番茄', delta: 'off' },
      { at: morning + 2, kind: 'fridge', id: 'o_盐', name: '盐', delta: 'off' },
      { at: again, kind: 'fridge', id: 'o_鸡蛋', name: '鸡蛋', delta: 'off' },
    ]
    const view = summarizeJournal(events, at(2026, 10, 16, 12))
    expect(view.days).toEqual([{ date: '2026-10-16', on: [], off: ['鸡蛋', '番茄', '盐'] }])
  })

  it('创建和取消不进常用食材，勾上次数相同则更近的在前', () => {
    const now = at(2026, 10, 16, 18)
    const events: JournalEvent[] = [
      { at: now - 5_000, kind: 'create', id: 'm_1', name: '我的菜', source: 'mine' },
      { at: now - 4_000, kind: 'fridge', id: 'o_盐', name: '盐', delta: 'off' },
      { at: now - 3_000, kind: 'fridge', id: 'o_番茄', name: '番茄', delta: 'on' },
      { at: now - 2_000, kind: 'fridge', id: 'o_鸡蛋', name: '鸡蛋', delta: 'on' },
      { at: now - 1_000, kind: 'fridge', id: 'o_番茄', name: '番茄', delta: 'on' },
    ]
    const view = summarizeJournal(events, now)
    expect(view.frequentIngredients.map((item) => item.id)).toEqual(['o_番茄', 'o_鸡蛋'])
    expect(view.created).toEqual([{ at: now - 5_000, id: 'm_1', name: '我的菜' }])
    expect(view.days[0]?.on).toEqual(['番茄', '鸡蛋'])
  })

  it('新的日期和最近浏览排在前面，浏览最多留 20 条', () => {
    const older = at(2026, 10, 15, 12)
    const newer = at(2026, 10, 16, 12)
    const fridge: JournalEvent[] = [
      { at: older, kind: 'fridge', id: 'o_鸡蛋', name: '鸡蛋', delta: 'on' },
      { at: newer, kind: 'fridge', id: 'o_番茄', name: '番茄', delta: 'on' },
    ]
    const views: JournalEvent[] = Array.from({ length: 21 }, (_, index) => ({
      at: newer + index,
      kind: 'view' as const,
      id: `r-${index}`,
      name: `菜${index}`,
      source: 'official' as const,
    }))
    const view = summarizeJournal([...fridge, ...views], newer + 21)
    expect(view.days.map((row) => row.date)).toEqual(['2026-10-16', '2026-10-15'])
    expect(view.recentViews).toHaveLength(20)
    expect(view.recentViews[0]?.id).toBe('r-20')
    expect(view.recentViews[19]?.id).toBe('r-1')
  })

  it('不修改入参', () => {
    const events: JournalEvent[] = [
      { at: at(2026, 10, 16, 8), kind: 'view', id: 'r1', name: '番茄炒蛋', source: 'official' },
    ]
    const snapshot = events.map((event) => ({ ...event }))
    summarizeJournal(events, at(2026, 10, 16, 12))
    expect(events).toEqual(snapshot)
  })
})

import { describe, expect, it } from 'vitest'
import type { Recipe } from '../types/eat'
import { matchRecipes } from './match.js'

const tomatoEgg: Recipe = {
  id: 'r1',
  name: '番茄炒蛋',
  need: ['egg', 'tomato'],
  steps: ['鸡蛋打散', '下番茄', '调味出锅'],
  source: 'official',
}
const mineSameName: Recipe = { ...tomatoEgg, id: 'm1', source: 'mine' }
const chicken: Recipe = {
  id: 'r2',
  name: '可乐鸡翅',
  need: ['wing', 'cola', 'soy'],
  steps: ['煎翅', '倒可乐', '收汁'],
  source: 'official',
}

describe('matchRecipes', () => {
  it('冰箱里没有这道菜的任何食材时，不进还差', () => {
    const r = matchRecipes(['passion'], [tomatoEgg])
    expect(r.ready).toEqual([])
    expect(r.almost).toEqual([])
  })

  it('全齐进 ready', () => {
    const r = matchRecipes(['egg', 'tomato'], [tomatoEgg])
    expect(r.ready.map((x) => x.id)).toEqual(['r1'])
    expect(r.almost).toEqual([])
  })

  it('已经有一样、还缺 1 样时进 almost', () => {
    const r = matchRecipes(['egg'], [tomatoEgg])
    expect(r.almost.map((x) => x.id)).toEqual(['r1'])
    expect(r.almost[0].missing).toEqual(['tomato'])
  })

  it('缺 3 样不出现', () => {
    const r = matchRecipes([], [chicken])
    expect(r.ready).toEqual([])
    expect(r.almost).toEqual([])
  })

  it('三样里已有一样、还缺两样时进 almost', () => {
    const r = matchRecipes(['wing'], [chicken])
    expect(r.almost[0].missing).toEqual(['cola', 'soy'])
  })

  it('空 need 丢弃', () => {
    const dirty: Recipe = { id: 'x', name: '空', need: [], steps: [], source: 'official' }
    const r = matchRecipes(['egg'], [dirty])
    expect(r.ready).toEqual([])
    expect(r.almost).toEqual([])
  })

  it('同名官方排在我的前面', () => {
    const r = matchRecipes(['egg', 'tomato'], [mineSameName, tomatoEgg])
    expect(r.ready.map((x) => x.id)).toEqual(['r1', 'm1'])
  })
})

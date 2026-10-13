export type IconTone = 'ink' | 'on' | 'earth'

const CATEGORY_ICON: Record<string, string> = {
  全部: 'all',
  荤菜: 'meat',
  素菜: 'vegetable',
  水产: 'fish',
  主食: 'staple',
  汤羹: 'soup',
  早餐: 'breakfast',
  甜品: 'dessert',
  饮品: 'drink',
  调味: 'seasoning',
  半成品: 'semi',
  我的: 'mine',
  其他: 'other',
}

const GROUP_ICON: Record<string, string> = {
  蔬菜: 'vegetable',
  肉类: 'meat',
  水产: 'fish',
  蛋奶豆: 'egg',
  主食: 'staple',
  干货坚果: 'nut',
  水果: 'fruit',
  调味: 'seasoning',
  自定义: 'custom',
}

export function categoryIcon(label: string): string {
  return CATEGORY_ICON[label] ?? 'other'
}

export function groupIcon(label: string): string {
  return GROUP_ICON[label] ?? 'other'
}

export function iconPath(name: string, tone: IconTone = 'ink'): string {
  const suffix = tone === 'ink' ? '' : `-${tone}`
  return `/static/icons/${name}${suffix}.png`
}

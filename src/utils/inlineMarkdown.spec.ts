import { describe, expect, it } from 'vitest'
import { hasInlineText, inlineParts } from './inlineMarkdown'

describe('inlineParts', () => {
  it('把成对星号显示成黑体，单星号显示成斜体', () => {
    expect(inlineParts('把**弄散了混合好**的，蒸**5**分钟')).toEqual([
      { text: '把' },
      { text: '弄散了混合好', bold: true },
      { text: '的，蒸' },
      { text: '5', bold: true },
      { text: '分钟' },
    ])
    expect(inlineParts('微波至*不透明且容易散开*时')).toEqual([
      { text: '微波至' },
      { text: '不透明且容易散开', italic: true },
      { text: '时' },
    ])
  })

  it('转义星号和用量里的乘号保持原样', () => {
    expect(inlineParts('切成 4cm\\*4cm\\*4cm 的大块')).toEqual([{ text: '切成 4cm*4cm*4cm 的大块' }])
    expect(inlineParts('3g * 2 人')).toEqual([{ text: '3g * 2 人' }])
  })

  it('去掉仓库图片，相对链接只留文字，网页链接另起可复制地址', () => {
    expect(hasInlineText('![改刀](./改刀.jpg)')).toBe(false)
    expect(inlineParts('煎 3-5 分钟即可。![葱白](./葱白.jpeg)')).toEqual([{ text: '煎 3-5 分钟即可。' }])
    expect(inlineParts('[腌制](../../tips/learn/学习腌.md)')).toEqual([{ text: '腌制' }])
    expect(inlineParts('参考：[教学](https://www.bilibili.com/video/BV1)')).toEqual([
      { text: '参考：' },
      { text: '教学' },
      { text: ' https://www.bilibili.com/video/BV1', link: true },
    ])
  })
})

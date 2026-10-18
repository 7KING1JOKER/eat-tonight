import { describe, expect, it } from 'vitest'
import { coverFileId } from './covers'

describe('coverFileId', () => {
  it('未知菜谱编号得到空字符串', () => {
    expect(coverFileId('missing', {})).toBe('')
    expect(coverFileId('missing', { h6ce66be9: 'cloud://a' })).toBe('')
  })

  it('表里有的编号返回对应的云文件编号', () => {
    expect(coverFileId('h6ce66be9', { h6ce66be9: 'cloud://a' })).toBe('cloud://a')
  })
})

/** 按菜谱编号取出云存储文件编号。没有时返回空字符串，卡片继续用亚麻色块。 */
export function coverFileId(id: string, map: Record<string, string>): string {
  return map[id] ?? ''
}

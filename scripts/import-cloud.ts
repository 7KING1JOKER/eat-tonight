import { readFileSync } from 'node:fs'
import * as path from 'node:path'

const root = path.resolve(__dirname, '..')

interface SeedRecipe {
  id: string
  name: string
  need: string[]
  steps: string[]
}

/**
 * 检查种子 JSON，并打印导入云数据库时要带上的 source。
 * 不连接云、不读取密钥。真正写入请在微信云控制台导入，或在开发者工具里上传后再执行。
 */
function main(): void {
  const ingredients = JSON.parse(readFileSync(path.join(root, 'data/ingredients.json'), 'utf8')) as unknown[]
  const recipes = JSON.parse(readFileSync(path.join(root, 'data/recipes.json'), 'utf8')) as SeedRecipe[]
  const withSource = recipes.map((row) => ({ ...row, source: 'official' as const }))
  const emptyNeed = withSource.filter((row) => row.need.length === 0)
  if (emptyNeed.length > 0) {
    throw new Error(`这些菜 need 为空：${emptyNeed.map((row) => row.id).join(', ')}`)
  }
  console.log(`ingredients ${ingredients.length} 条，recipes ${withSource.length} 条，source 已补 official`)
  console.log('请在云控制台导入 data/ingredients.json 与 data/recipes.json。菜谱导入时加上 source: official，或导入后由端上读取时补。')
}

main()

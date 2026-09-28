const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/**
 * 只返回当前用户的 openid。
 * 不要在这里做 matchRecipes 或任何菜谱筛选。
 */
exports.main = async () => {
  const { OPENID } = cloud.getWXContext()
  return { openid: OPENID }
}

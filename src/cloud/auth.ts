import { CLOUD_ENV_ID, hasCloudEnv } from './env'
import { CACHE_KEY_ANON, readCache, writeCache } from '@/utils/storage'

interface WxCloud {
  init(options: { env: string; traceUser?: boolean }): void
  callFunction(options: { name: string }): Promise<{ result?: { openid?: string } }>
}

/** 取微信云对象。H5 和非微信环境没有 wx.cloud。 */
function wxCloud(): WxCloud | null {
  const host = globalThis as { wx?: { cloud?: WxCloud } }
  return host.wx?.cloud ?? null
}

/**
 * 小程序启动时初始化云开发。没有环境 ID 或当前不是微信时什么都不做。
 * 条件编译只包住真正调用 wx.cloud 的部分。
 */
export function initCloud(): void {
  // #ifdef MP-WEIXIN
  const cloud = wxCloud()
  if (!cloud || !hasCloudEnv()) return
  cloud.init({ env: CLOUD_ENV_ID, traceUser: true })
  // #endif
}

/**
 * 登录并拿到 openid。失败或不支持时返回 null，调用方改为只读本地缓存。
 * 微信：调用只返回 openid 的云函数 `login`，函数里不做菜谱匹配。
 * H5：生成本地匿名 id，云写失败时冰箱和我的菜仍留在本机。
 */
export async function login(): Promise<{ openid: string } | null> {
  // #ifdef MP-WEIXIN
  const weixin = await loginWeixin()
  if (weixin) return weixin
  // #endif
  // #ifdef H5
  return { openid: anonId() }
  // #endif
  return null
}

/** 微信云函数登录。云环境未配置或调用失败时返回 null。 */
async function loginWeixin(): Promise<{ openid: string } | null> {
  const cloud = wxCloud()
  if (!cloud || !hasCloudEnv()) return null
  initCloud()
  try {
    const res = await cloud.callFunction({ name: 'login' })
    const openid = res.result?.openid
    return openid ? { openid } : null
  } catch {
    return null
  }
}

/**
 * H5 匿名身份。同一个浏览器反复打开会复用，避免冰箱勾选对不上。
 * 这不是微信 openid，只给本地存储当钥匙。
 */
function anonId(): string {
  const existing = readCache<string>(CACHE_KEY_ANON)
  if (existing) return existing
  const id = `h5_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  writeCache(CACHE_KEY_ANON, id)
  return id
}

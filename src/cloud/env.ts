/**
 * 微信云开发环境 ID。
 * 留空表示还没开通：端上只读本地缓存，不发起云请求。
 * 开通后只改这一处。不要写 AppSecret 或私钥。
 * H5 不调用 wx.cloud，登录分支在 auth.ts 里用条件编译分开。
 */
export const CLOUD_ENV_ID = 'cloud-eat-tonight-d9dhjc9a9f0fd7'

/** 是否已经配置云环境。空字符串表示只走本地。 */
export function hasCloudEnv(): boolean {
  return CLOUD_ENV_ID.length > 0
}

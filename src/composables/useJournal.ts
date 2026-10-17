import { computed, ref } from 'vue'
import { login } from '@/cloud/auth'
import { getJournal, setJournal } from '@/cloud/db'
import { hasCloudEnv } from '@/cloud/env'
import { appendJournal, summarizeJournal, type JournalEvent } from '@/utils/journal'
import { CACHE_KEY_JOURNAL, readCache, writeCache } from '@/utils/storage'

/** 习惯记录在本地缓存里的形状。`pendingSync` 与冰箱的分开。 */
interface JournalCache {
  events: JournalEvent[]
  pendingSync: boolean
}

const journal = ref<JournalEvent[]>([])
const pendingSync = ref(false) // 用来标记是否写上云失败了
const view = computed(() => summarizeJournal(journal.value, Date.now()))

function snapshot(): JournalCache {
  return { events: journal.value, pendingSync: pendingSync.value }
}

/**
 * 追加一条记录。先写入本地，再尝试上云。失败不回滚。
 * 还没配置云环境时只留在本机，不提示未同步。
 * 已配置云环境时，login() 为 null 或 setJournal 抛错：toast「未同步」，pendingSync 设为 true。
 * 存储失败不打断勾选、打开详情和保存。
 */
async function recordJournal(event: JournalEvent): Promise<void> {
  try {
    const cache = readCache<JournalCache>(CACHE_KEY_JOURNAL)
    const prev = cache?.events ?? journal.value
    if (cache) pendingSync.value = cache.pendingSync
    journal.value = appendJournal(prev, event)
    writeCache(CACHE_KEY_JOURNAL, snapshot())

    if (!hasCloudEnv()) {
      pendingSync.value = false
      writeCache(CACHE_KEY_JOURNAL, snapshot())
      return
    }
    
    const session = await login()
    if (!session) {
      uni.showToast({ title: '未同步', icon: 'none' })
      pendingSync.value = true
      writeCache(CACHE_KEY_JOURNAL, snapshot())
      return
    }
    try {
      await setJournal(session.openid, journal.value)
      pendingSync.value = false
      writeCache(CACHE_KEY_JOURNAL, snapshot())
    } catch {
      uni.showToast({ title: '未同步', icon: 'none' })
      pendingSync.value = true
      writeCache(CACHE_KEY_JOURNAL, snapshot())
    }
  } catch {
    // 存储失败不打断勾选、打开详情和保存。
  }
}

/**
 * 打开「我的」时调用。先读本地缓存。
 * 只有云已配置、本地还没有这份缓存、且 pendingSync 不为真时，才用 getJournal 的结果覆盖。
 * 云上还没有文档时保留本地记录，不提示。
 */
async function loadJournal(): Promise<void> {
  const cache = readCache<JournalCache>(CACHE_KEY_JOURNAL)
  if (cache) {
    journal.value = cache.events
    pendingSync.value = cache.pendingSync
  }
  if (!hasCloudEnv() || cache || pendingSync.value) return
  const session = await login()
  if (!session) return
  try {
    journal.value = await getJournal(session.openid)
    pendingSync.value = false
    writeCache(CACHE_KEY_JOURNAL, snapshot())
  } catch {
    // 云上还没有这份记录时保留本地。
  }
}

export function useJournal() {
  return { view, recordJournal, loadJournal }
}

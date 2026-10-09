import { computed } from 'vue'
import { matchRecipes } from '@/utils/match'
import { useFridge } from '@/composables/useFridge'
import { useRecipes } from '@/composables/useRecipes'

/**
 * 由冰箱 have 和菜谱算出今晚能做、还差 1～2 样。
 * have 为空时两组都是空数组，不调用 matchRecipes。
 */
export function useMatch() {
  const { have } = useFridge()
  const { official, mine } = useRecipes()

  const matched = computed(() => {
    if (have.value.length === 0) return { ready: [], almost: [] }
    return matchRecipes(have.value, official.value.concat(mine.value))
  })

  const ready = computed(() => matched.value.ready)
  const almost = computed(() => matched.value.almost)
  return { ready, almost }
}
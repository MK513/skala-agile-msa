<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <main class="main-content">
        <!-- 프로필 요약 -->
        <div v-if="profile" class="profile-summary fade-in-up">
          <div>
            <div class="summary-label">내 프로필</div>
            <div class="summary-text">{{ profileSummary }}</div>
          </div>
          <router-link to="/profile-setup" class="edit-link">프로필 수정</router-link>
        </div>

        <h1 class="page-title">AI 맞춤 매칭 지원사업</h1>
        <p v-if="coldStart && !loading" class="coldstart-note">
          아직 추천 이력이 없어 관심 분야를 기준으로 전체 지원사업을 보여드려요.
        </p>

        <div v-if="loading" class="loading-grid">
          <div v-for="i in 4" :key="i" class="skeleton-card">
            <div class="skeleton-line short"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line medium"></div>
          </div>
        </div>

        <p v-else-if="errorMessage" class="empty-text">{{ errorMessage }}</p>

        <div v-else-if="courses.length" class="recommend-list fade-in">
          <article v-for="course in courses" :key="course.id" class="recommend-card">
            <span v-if="isMatched(course)" class="ai-badge">✨ 적합도 95% AI 추천</span>

            <div class="card-top">
              <span class="badge" :class="badgeClass(course.category)">{{ course.category }}</span>
              <h3 class="card-title">{{ course.title }}</h3>
            </div>

            <div class="card-meta">
              <span class="price">지원한도 ₩{{ Number(course.price || 0).toLocaleString() }}</span>
              <span class="enrolled">신청 {{ Number(course.enrollmentCount ?? 0).toLocaleString() }}건</span>
            </div>

            <div class="card-actions">
              <router-link :to="`/courses/${course.id}`" class="btn btn-primary btn-sm">
                사업 상세 보기 · AI 서류 자동 작성
              </router-link>
            </div>
          </article>
        </div>

        <p v-else class="empty-text">조건에 맞는 지원사업이 없습니다.</p>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/store/auth.js'
import { useCourseStore } from '@/store/course.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { courseApi } from '@/api/course.js'

const PROFILE_STORAGE_KEY = 'user_profile'

const categoryBadgeMap = {
  '고용': 'badge-teal',
  'R&D': 'badge-blue',
  '수출': 'badge-purple',
  '설비': 'badge-amber',
  '주거': 'badge-pink',
  '청년': 'badge-teal',
  '창업': 'badge-blue',
  '기타': 'badge-gray'
}

const router = useRouter()
const auth = useAuthStore()
const courseStore = useCourseStore()

const profile = ref(null)
const courses = ref([])
const loading = ref(true)
const errorMessage = ref('')
const coldStart = ref(false)

const interestLabels = computed(() => {
  if (!profile.value?.categories?.length) return []
  return profile.value.categories.map((c) => courseStore.categoryLabelMap[c] || c)
})

const profileSummary = computed(() => {
  if (!profile.value) return ''
  const labels = interestLabels.value.length ? interestLabels.value.join(', ') : '전체'

  if (profile.value.userType === 'YOUTH') {
    return `청년 신청자 / 선호: ${labels}`
  }

  const industry = profile.value.company?.industry
  return `${industry ? industry + ' ' : ''}기업 / 선호: ${labels}`
})

function badgeClass(category) {
  return categoryBadgeMap[category] || 'badge-gray'
}

function isMatched(course) {
  if (!interestLabels.value.length) return false
  return interestLabels.value.includes(courseStore.normalizeCategory(course.category))
}

function extractList(payload, keys) {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key]
  }
  return Array.isArray(payload) ? payload : []
}

function sortByInterest(list) {
  if (!interestLabels.value.length) return list
  return [...list].sort((a, b) => Number(isMatched(b)) - Number(isMatched(a)))
}

function filterByInterest(list) {
  if (!interestLabels.value.length) return list
  const matched = list.filter(isMatched)
  return matched.length ? matched : list
}

async function loadColdStartCourses() {
  const res = await courseApi.getCourses()
  const rawCourses = extractList(res.data, ['data'])
  return rawCourses.map((c) => courseStore.normalizeCourse(c))
}

async function loadRecommendations() {
  loading.value = true
  errorMessage.value = ''
  coldStart.value = false

  try {
    const userId = auth.user?.id
    if (!userId) {
      throw new Error('사용자 정보를 확인할 수 없습니다.')
    }

    const res = await enrollmentApi.getRecommendations(userId)
    console.log('[RecommendList] recommendation response:', res.data)

    const rawList = extractList(res.data, ['recommendedCourses', 'data'])

    if (rawList.length) {
      const normalized = rawList.map((c) => courseStore.normalizeCourse(c))
      courses.value = sortByInterest(filterByInterest(normalized))
    } else {
      coldStart.value = true
      courses.value = filterByInterest(await loadColdStartCourses())
    }
  } catch (error) {
    console.error('[RecommendList] failed to load recommendations:', error)

    try {
      coldStart.value = true
      courses.value = filterByInterest(await loadColdStartCourses())
    } catch (fallbackError) {
      console.error('[RecommendList] fallback course list failed:', fallbackError)
      errorMessage.value = '추천 지원사업을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
      courses.value = []
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY)

  if (!raw) {
    router.replace('/profile-setup')
    return
  }

  try {
    profile.value = JSON.parse(raw)
  } catch (error) {
    console.error('[RecommendList] 저장된 프로필 파싱 실패:', error)
    router.replace('/profile-setup')
    return
  }

  if (!auth.user) {
    await auth.fetchUser()
  }

  await loadRecommendations()
})
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.page-layout {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.main-content {
  min-width: 0;
}

.profile-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 18px 22px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 24px;
}

.summary-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.summary-text {
  font-size: 15px;
  font-weight: 700;
}

.edit-link {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
}

.edit-link:hover {
  text-decoration: underline;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 6px;
}

.coldstart-note {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 20px;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 20px;
}

.recommend-card {
  position: relative;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px 22px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
}

.recommend-card:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-md);
}

.ai-badge {
  position: absolute;
  top: -10px;
  right: 18px;
  background: linear-gradient(90deg, #185fa5, #378add);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 999px;
  box-shadow: var(--shadow-sm);
}

.card-top {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
}

.card-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.price {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
}

.enrolled {
  font-size: 12px;
  color: var(--color-text-muted);
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-actions .btn {
  width: 100%;
  justify-content: center;
}

.btn-sm {
  padding: 7px 14px;
  font-size: 13px;
}

.empty-text {
  color: var(--color-text-muted);
  font-size: 14px;
  padding: 40px 0;
  text-align: center;
}

.loading-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 20px;
}

.skeleton-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-line.short {
  width: 30%;
}

.skeleton-line.medium {
  width: 60%;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 640px) {
  .profile-summary {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

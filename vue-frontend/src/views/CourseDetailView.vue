<template>
  <div class="page-wrapper">
    <AppHeader />

    <div class="detail-layout" v-if="course">
      <div class="detail-hero">
        <div class="detail-hero-inner">
          <!-- 좌측 상세 정보 -->
          <div class="detail-info fade-in-up">
            <span class="badge" :class="badgeClass">{{ displayCategory }}</span>
            <h1 class="detail-title">{{ course.title }}</h1>
            <p class="detail-desc">
              {{ course.description || '실무 전문가가 직접 설계한 커리큘럼으로 체계적으로 학습하세요.' }}
            </p>

            <div class="detail-meta">
              <span>신청 건수: {{ displayEnrollmentCount }}건</span>
            </div>
          </div>

          <!-- 우측 결제/수강 카드 -->
          <div class="enroll-card fade-in">
            <div class="enroll-thumb" :class="thumbBg">
              <img v-if="thumbSrc" :src="thumbSrc" :alt="course.title" />
            </div>

            <div class="enroll-body">
              <div class="enroll-price-label">지원 한도액</div>
              <div class="enroll-price">₩{{ displayPrice }}</div>

              <button
                class="btn btn-primary btn-full"
                @click="handlePrimaryAction"
                :disabled="buttonDisabled"
                :class="{ 'btn-disabled': buttonDisabled }"
              >
                <span v-if="enrolling">처리 중...</span>
                <span v-else>{{ buttonLabel }}</span>
              </button>

              <div v-if="enrollError" class="error-msg">{{ enrollError }}</div>

              <p class="helper-text" v-if="helperText">
                {{ helperText }}
              </p>

              <ul class="enroll-info-list">
                <li>✅ 온라인 신청 접수</li>
                <li>✅ 담당자 서류 심사</li>
                <li>✅ 심사 결과 알림</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="loading-center">
      <div class="spinner"></div>
    </div>

    <div v-else class="loading-center">
      <p class="empty-text">지원사업 정보를 불러오지 못했습니다.</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useCourseStore } from '@/store/course.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { useAuthStore } from '@/store/auth.js'

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const auth = useAuthStore()

const enrolling = ref(false)
const enrollError = ref('')
const enrollmentStatus = ref('NONE') // NONE | PENDING | ACTIVE

const course = computed(() => courseStore.selectedCourse)
const loading = computed(() => courseStore.loading)
const isInstructor = computed(() => auth.user?.role === 'INSTRUCTOR')

const categoryConfig = {
  '고용': { badge: 'badge-teal', bg: 'thumb-teal' },
  'R&D': { badge: 'badge-blue', bg: 'thumb-blue' },
  '수출': { badge: 'badge-purple', bg: 'thumb-purple' },
  '설비': { badge: 'badge-amber', bg: 'thumb-amber' },
  '주거': { badge: 'badge-pink', bg: 'thumb-pink' },
  '청년': { badge: 'badge-teal', bg: 'thumb-teal' },
  '창업': { badge: 'badge-blue', bg: 'thumb-blue' },
  '기타': { badge: 'badge-gray', bg: 'thumb-gray' },
}

const config = computed(() => categoryConfig[course.value?.category] || {})
const badgeClass = computed(() => config.value.badge || 'badge-gray')
const thumbBg = computed(() => config.value.bg || 'thumb-gray')

const displayCategory = computed(() => course.value?.category || '-')

const displayEnrollmentCount = computed(() => {
  const value = Number(
    course.value?.enrollmentCount ??
    course.value?.enrollment_count ??
    0
  )
  return Number.isNaN(value) ? 0 : value.toLocaleString()
})

const displayPrice = computed(() => {
  const value = Number(course.value?.price ?? 0)
  return Number.isNaN(value) ? '0' : value.toLocaleString()
})

const thumbSrc = computed(() => null)

const buttonLabel = computed(() => {
  if (isInstructor.value) return '기관 계정은 신청 불가'
  if (enrollmentStatus.value === 'ACTIVE') return '신청 현황 보기'
  if (enrollmentStatus.value === 'PENDING') return '심사 대기 중'
  return '지원 신청하기'
})

const buttonDisabled = computed(() => {
  if (enrolling.value) return true
  if (isInstructor.value) return true
  if (enrollmentStatus.value === 'PENDING') return true
  return false
})

const helperText = computed(() => {
  if (isInstructor.value) {
    return '지자체·수행기관 계정은 본인이 등록한 지원사업에 신청할 수 없습니다.'
  }

  if (enrollmentStatus.value === 'ACTIVE') {
    return '이미 승인된 지원사업입니다. 신청 현황에서 확인할 수 있습니다.'
  }

  if (enrollmentStatus.value === 'PENDING') {
    return '신청이 접수되어 심사가 진행 중입니다. 결과는 신청 현황에서 확인할 수 있습니다.'
  }

  return '신청 시 담당자 심사 후 결과가 안내됩니다.'
})

async function loadEnrollmentStatus() {
  if (!auth.user?.id || !course.value?.id || isInstructor.value) {
    enrollmentStatus.value = 'NONE'
    return
  }

  try {
    const res = await enrollmentApi.getMyEnrollments()
    console.log('[CourseDetail] my enrollments response =', res.data)

    const enrollments = Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data)
        ? res.data
        : []

    const matched = enrollments.find(item => Number(item.courseId) === Number(course.value.id))

    if (!matched) {
      enrollmentStatus.value = 'NONE'
      return
    }

    enrollmentStatus.value = matched.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING'
  } catch (e) {
    console.error('[CourseDetail] failed to load enrollment status:', e)
    enrollmentStatus.value = 'NONE'
  }
}

async function handlePrimaryAction() {
  enrollError.value = ''

  if (!course.value?.id) {
    enrollError.value = '지원사업 정보가 올바르지 않습니다.'
    return
  }

  if (!auth.isAuthenticated) {
    alert('로그인이 필요합니다.')
    router.push('/login')
    return
  }

  if (isInstructor.value) {
    enrollError.value = '지자체·수행기관 계정은 본인이 등록한 지원사업에 신청할 수 없습니다.'
    return
  }

  if (enrollmentStatus.value === 'ACTIVE') {
    router.push('/enrollments')
    return
  }

  if (enrollmentStatus.value === 'PENDING') {
    return
  }

  enrolling.value = true

  try {
    await enrollmentApi.enroll(course.value.id)
    enrollmentStatus.value = 'PENDING'
    alert('신청이 완료되었습니다 (심사 대기)')
    router.push('/enrollments')
  } catch (e) {
    console.error('[CourseDetail] enroll failed:', e)
    enrollError.value = e.response?.data?.message || '지원 신청에 실패했습니다.'
  } finally {
    enrolling.value = false
  }
}

onMounted(async () => {
  await courseStore.fetchCourse(route.params.id)
  console.log('[CourseDetail] selectedCourse =', courseStore.selectedCourse)
  await loadEnrollmentStatus()
})

watch(
  () => courseStore.selectedCourse,
  async (value) => {
    console.log('[CourseDetail] selectedCourse changed =', value)
    if (value?.id) {
      await loadEnrollmentStatus()
    }
  },
  { deep: true }
)
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.detail-hero {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%);
  border-bottom: 1px solid var(--color-border);
  padding: 48px 0;
}

.detail-hero-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 48px;
  align-items: start;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-title {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.3;
}

.detail-desc {
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.detail-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: var(--color-text-secondary);
  flex-wrap: wrap;
}

.enroll-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.enroll-thumb {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.enroll-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 20px;
}

.thumb-teal { background: #E1F5EE; }
.thumb-blue { background: #E6F1FB; }
.thumb-amber { background: #FAEEDA; }
.thumb-purple { background: #EEEDFE; }
.thumb-pink { background: #FBEAF0; }
.thumb-gray { background: #F1EFE8; }

.enroll-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.enroll-price-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.enroll-price {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-primary);
}

.btn-full {
  width: 100%;
  padding: 13px;
  font-size: 15px;
  justify-content: center;
}

.btn-disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.enroll-info-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.enroll-info-list li {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.error-msg {
  font-size: 13px;
  color: #dc2626;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: var(--radius-sm);
}

.helper-text {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.empty-text {
  font-size: 14px;
  color: var(--color-text-muted);
}

.loading-center {
  display: flex;
  justify-content: center;
  padding: 100px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.badge-gray {
  background: #f3f4f6;
  color: #6b7280;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .detail-hero-inner {
    grid-template-columns: 1fr;
  }
}
</style>
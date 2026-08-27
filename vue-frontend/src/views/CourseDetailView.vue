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
                <li><span class="check-mark" aria-hidden="true">✓</span> 온라인 신청 접수</li>
                <li><span class="check-mark" aria-hidden="true">✓</span> 담당자 서류 심사</li>
                <li><span class="check-mark" aria-hidden="true">✓</span> 심사 결과 알림</li>
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

    <!-- AI 서류 자동 작성 모달 -->
    <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-box fade-in-up">
        <h2 class="modal-title">AI 서류 자동 작성</h2>
        <p class="modal-subtitle">{{ course?.title }}</p>

        <label class="field">
          <span class="field-label">신청 서류 초안</span>
          <textarea v-model="draftText" class="draft-textarea" rows="10"></textarea>
        </label>

        <div v-if="enrollError" class="error-msg">{{ enrollError }}</div>

        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" @click="closeModal">닫기</button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="enrolling"
            @click="confirmEnrollment"
          >
            {{ enrolling ? '접수 중...' : '이 내용으로 신청 접수' }}
          </button>
        </div>
      </div>
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

const modalOpen = ref(false)
const draftText = ref('')

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
  return 'AI 서류 자동 작성'
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

  return 'AI가 프로필 정보를 바탕으로 신청 서류 초안을 자동으로 작성해 드립니다.'
})

function buildDraftText() {
  const raw = localStorage.getItem('user_profile')
  let profile = null

  try {
    profile = raw ? JSON.parse(raw) : null
  } catch (e) {
    console.error('[CourseDetail] 저장된 프로필 파싱 실패:', e)
  }

  const applicant =
    profile?.userType === 'YOUTH'
      ? `${profile?.name || auth.user?.name || '신청자'} (청년, ${profile?.youth?.age ?? '-'}세)`
      : `${profile?.name || auth.user?.name || '신청 기업'} (${profile?.company?.industry || '업종 미입력'}, 상시근로자 ${profile?.company?.employeeCount ?? '-'}명)`

  return `[신청 서류 초안]

- 지원 기업/신청자 정보: ${applicant}
- 이메일: ${profile?.email || auth.user?.email || '-'}
- 신청 사업명: ${course.value?.title}
- 지원 분야: ${displayCategory.value}
- 지원 한도액: ₩${displayPrice.value}

위 사업에 대한 지원을 신청합니다. AI가 자동으로 생성한 초안이며, 제출 전 자유롭게 수정하실 수 있습니다.`
}

function closeModal() {
  modalOpen.value = false
}

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

  draftText.value = buildDraftText()
  modalOpen.value = true
}

async function confirmEnrollment() {
  enrollError.value = ''
  enrolling.value = true

  try {
    await enrollmentApi.enroll(course.value.id)
    enrollmentStatus.value = 'PENDING'
    modalOpen.value = false
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.check-mark {
  font-weight: 700;
  color: var(--color-text-primary);
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

/* AI 서류 자동 작성 모달 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 200;
}

.modal-box {
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-lg);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.modal-subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.draft-textarea {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-primary);
  resize: vertical;
}

.draft-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
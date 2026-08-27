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

              <div class="ref-upload-section">
                <div class="ref-upload-label">AI가 참고할 파일</div>

                <label class="btn btn-outline btn-full ref-upload-btn">
                  📎 파일 업로드
                  <input
                    type="file"
                    multiple
                    class="ref-upload-input"
                    @change="handleFileUpload"
                  />
                </label>

                <ul v-if="referenceFiles.length" class="ref-file-list">
                  <li v-for="(file, idx) in referenceFiles" :key="`${file.name}-${idx}`" class="ref-file-item">
                    <span class="ref-file-icon">📄</span>
                    <span class="ref-file-name" :title="file.name">{{ file.name }}</span>
                    <span class="ref-file-size">{{ formatFileSize(file.size) }}</span>
                    <button
                      type="button"
                      class="ref-file-remove"
                      aria-label="파일 제거"
                      @click="removeReferenceFile(idx)"
                    >
                      ✕
                    </button>
                  </li>
                </ul>
                <p v-else class="ref-file-empty">
                  사업자등록증, 재직증명서 등 참고 파일을 업로드하면 AI 서류 작성 시 활용됩니다.
                </p>
              </div>
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

        <!-- 생성 대기 애니메이션 -->
        <div v-if="modalStage === 'loading'" class="ai-loading">
          <div class="ai-spinner">
            <span class="ai-spinner-core">✨</span>
          </div>
          <p class="ai-loading-text">{{ loadingMessage }}</p>
        </div>

        <!-- 생성 결과 -->
        <template v-else>
          <div class="ai-result fade-in">
            <iframe
              :src="aiDocumentFile"
              class="ai-doc-frame"
              title="AI가 자동으로 작성한 신청 서류 초안 미리보기 (PDF)"
            ></iframe>
            <a :href="aiDocumentFile" target="_blank" rel="noopener" class="ai-doc-open-link">
              새 창에서 크게 보기 ↗
            </a>
          </div>

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
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useCourseStore } from '@/store/course.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { useAuthStore } from '@/store/auth.js'
import aiDocumentFile from '@/assets/files/ai-document-mockup.pdf'

const AI_LOADING_DURATION_MS = 3000
const AI_LOADING_MESSAGES = [
  'AI가 프로필 정보를 분석하고 있습니다...',
  '사업 요건에 맞춰 서류 항목을 채우고 있습니다...',
  '신청 서류 초안 생성을 마무리하고 있습니다...'
]

const route = useRoute()
const router = useRouter()
const courseStore = useCourseStore()
const auth = useAuthStore()

const enrolling = ref(false)
const enrollError = ref('')
const enrollmentStatus = ref('NONE') // NONE | PENDING | ACTIVE

const modalOpen = ref(false)
const modalStage = ref('loading') // loading | result
const loadingMessage = ref(AI_LOADING_MESSAGES[0])

let loadingMessageTimer = null
let loadingDoneTimer = null

const referenceFiles = ref([])

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

function clearLoadingTimers() {
  if (loadingMessageTimer) {
    clearInterval(loadingMessageTimer)
    loadingMessageTimer = null
  }
  if (loadingDoneTimer) {
    clearTimeout(loadingDoneTimer)
    loadingDoneTimer = null
  }
}

function openAiModal() {
  modalStage.value = 'loading'
  loadingMessage.value = AI_LOADING_MESSAGES[0]
  modalOpen.value = true

  clearLoadingTimers()

  let step = 0
  loadingMessageTimer = setInterval(() => {
    step += 1
    if (step < AI_LOADING_MESSAGES.length) {
      loadingMessage.value = AI_LOADING_MESSAGES[step]
    }
  }, AI_LOADING_DURATION_MS / AI_LOADING_MESSAGES.length)

  loadingDoneTimer = setTimeout(() => {
    clearLoadingTimers()
    modalStage.value = 'result'
  }, AI_LOADING_DURATION_MS)
}

function closeModal() {
  modalOpen.value = false
  clearLoadingTimers()
}

onBeforeUnmount(() => {
  clearLoadingTimers()
})

function referenceFilesStorageKey(courseId) {
  return `ai_reference_files_${courseId}`
}

function loadReferenceFiles(courseId) {
  if (!courseId) {
    referenceFiles.value = []
    return
  }

  try {
    const raw = localStorage.getItem(referenceFilesStorageKey(courseId))
    referenceFiles.value = raw ? JSON.parse(raw) : []
  } catch (e) {
    console.error('[CourseDetail] 참고 파일 목록 파싱 실패:', e)
    referenceFiles.value = []
  }
}

function saveReferenceFiles() {
  if (!course.value?.id) return
  localStorage.setItem(referenceFilesStorageKey(course.value.id), JSON.stringify(referenceFiles.value))
}

function handleFileUpload(event) {
  const files = Array.from(event.target.files || [])
  if (files.length) {
    files.forEach((file) => {
      referenceFiles.value.push({ name: file.name, size: file.size })
    })
    saveReferenceFiles()
  }

  event.target.value = ''
}

function removeReferenceFile(index) {
  referenceFiles.value.splice(index, 1)
  saveReferenceFiles()
}

function formatFileSize(bytes) {
  const value = Number(bytes)
  if (!Number.isFinite(value)) return ''
  if (value < 1024) return `${value}B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)}KB`
  return `${(value / (1024 * 1024)).toFixed(1)}MB`
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

  openAiModal()
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
  loadReferenceFiles(courseStore.selectedCourse?.id)
  await loadEnrollmentStatus()
})

watch(
  () => courseStore.selectedCourse?.id,
  (id, prevId) => {
    if (id && id !== prevId) {
      loadReferenceFiles(id)
    }
  }
)

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

.ref-upload-section {
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ref-upload-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.ref-upload-btn {
  position: relative;
  cursor: pointer;
  overflow: hidden;
}

.ref-upload-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.ref-file-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ref-file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  font-size: 12.5px;
}

.ref-file-icon {
  flex-shrink: 0;
  font-size: 13px;
}

.ref-file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-primary);
  font-weight: 500;
}

.ref-file-size {
  flex-shrink: 0;
  color: var(--color-text-muted);
  font-size: 11px;
}

.ref-file-remove {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 11px;
  line-height: 1;
}

.ref-file-remove:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-danger);
}

.ref-file-empty {
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
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
  max-width: 884px;
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

.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 48px 12px;
}

.ai-spinner {
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 3px solid var(--color-primary-light);
  border-top-color: var(--color-primary);
  animation: spin 1s linear infinite;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-spinner-core {
  font-size: 22px;
  animation: pulse 1.2s ease-in-out infinite;
}

.ai-loading-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-align: center;
  min-height: 20px;
}

.ai-result {
  margin-bottom: 16px;
}

.ai-doc-frame {
  width: 100%;
  height: 782px;
  display: block;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  background: var(--color-bg-secondary);
}

.ai-doc-open-link {
  display: inline-block;
  margin-top: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--color-primary);
}

.ai-doc-open-link:hover {
  text-decoration: underline;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.7;
  }
}
</style>
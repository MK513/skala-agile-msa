<template>
  <div class="page-wrapper">
    <AppHeader />

    <main class="application-page">
      <div class="page-heading fade-in-up">
        <span class="step-label">지원 신청</span>
        <h1>참여할 지원 사업을 선택하세요</h1>
        <p>신청할 사업을 선택하고 내용을 확인한 뒤 신청을 완료할 수 있습니다.</p>
      </div>

      <div v-if="loading" class="state-card">
        <div class="spinner"></div>
        <p>지원 사업을 불러오고 있습니다.</p>
      </div>

      <div v-else-if="loadError" class="state-card error-state">
        <span>!</span>
        <p>{{ loadError }}</p>
        <button class="btn btn-outline" @click="loadCourses">다시 시도</button>
      </div>

      <div v-else class="application-layout">
        <section class="program-panel">
          <div class="panel-title">
            <h2>지원 가능 사업</h2>
            <span>{{ courses.length }}개</span>
          </div>

          <div v-if="courses.length" class="program-list">
            <button
              v-for="course in courses"
              :key="course.id"
              type="button"
              class="program-card"
              :class="{ selected: selectedCourse?.id === course.id }"
              @click="selectCourse(course)"
            >
              <span class="program-radio"></span>
              <span class="program-content">
                <span class="badge badge-blue">{{ course.category || '전체' }}</span>
                <strong>{{ course.title }}</strong>
                <small>{{ course.description || '사업 상세 설명이 없습니다.' }}</small>
              </span>
              <span class="program-price">{{ formatPrice(course.price) }}</span>
            </button>
          </div>

          <div v-else class="empty-programs">현재 신청할 수 있는 지원 사업이 없습니다.</div>
        </section>

        <aside class="summary-card">
          <h2>신청 내용 확인</h2>

          <template v-if="selectedCourse">
            <dl>
              <div><dt>신청자</dt><dd>{{ applicantName }}</dd></div>
              <div><dt>지원 사업</dt><dd>{{ selectedCourse.title }}</dd></div>
              <div><dt>분야</dt><dd>{{ selectedCourse.category || '-' }}</dd></div>
            </dl>

            <div class="notice">
              신청 완료 후 처리 상태는 내 신청 현황에서 확인할 수 있습니다.
            </div>

            <button
              type="button"
              class="btn btn-primary submit-button"
              :disabled="submitting || submitted"
              @click="submitApplication"
            >
              {{ submitting ? '신청 중...' : submitted ? '신청 완료' : '지원 신청하기' }}
            </button>
          </template>

          <p v-else class="select-guide">왼쪽에서 지원 사업을 선택해 주세요.</p>

          <p v-if="submitError" class="submit-message error-message">{{ submitError }}</p>
          <div v-if="submitted" class="success-box">
            <strong>신청이 접수되었습니다.</strong>
            <span>현재 상태는 PENDING입니다.</span>
            <router-link v-if="auth.isAuthenticated" to="/enrollments">내 신청 현황 보기 →</router-link>
            <span v-else class="mock-label">모킹 신청으로 저장된 데이터는 없습니다.</span>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { courseApi } from '@/api/course.js'
import { enrollmentApi } from '@/api/enrollment.js'
import { useAuthStore } from '@/store/auth.js'

const auth = useAuthStore()
const courses = ref([])
const selectedCourse = ref(null)
const loading = ref(true)
const loadError = ref('')
const submitting = ref(false)
const submitted = ref(false)
const submitError = ref('')

// TODO: 로그인 페이지 구현 완료 후 비로그인 개발용 모킹 데이터와 분기를 제거한다.
const mockCourses = [
  {
    id: 9001,
    title: '청년 디지털 역량 강화 지원사업',
    description: '디지털 분야 취업을 준비하는 청년을 위한 실무 교육 지원 프로그램입니다.',
    category: 'IT·디지털',
    price: 0
  },
  {
    id: 9002,
    title: '소상공인 온라인 판로 지원사업',
    description: '온라인 판매 채널 구축과 마케팅 역량 향상을 지원합니다.',
    category: '창업·경영',
    price: 0
  },
  {
    id: 9003,
    title: '재직자 AI 직무전환 교육',
    description: '생성형 AI를 활용한 업무 자동화와 직무 전환 교육 과정입니다.',
    category: 'AI',
    price: 0
  }
]

const applicantName = computed(() => auth.user?.name || '홍길동 (모킹)')

function formatPrice(price) {
  const value = Number(price)
  return Number.isFinite(value) && value > 0 ? `${value.toLocaleString()}원` : '무료'
}

function selectCourse(course) {
  selectedCourse.value = course
  submitted.value = false
  submitError.value = ''
}

async function loadCourses() {
  loading.value = true
  loadError.value = ''

  if (!auth.isAuthenticated) {
    courses.value = mockCourses
    loading.value = false
    return
  }

  try {
    const response = await courseApi.getCourses()
    const data = response.data?.data ?? response.data
    courses.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('[ApplicationView] failed to load courses:', error)
    loadError.value = '지원 사업 목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function submitApplication() {
  if (!selectedCourse.value || submitting.value) return
  submitting.value = true
  submitError.value = ''
  try {
    if (!auth.isAuthenticated) {
      await new Promise(resolve => setTimeout(resolve, 400))
      submitted.value = true
      return
    }

    await enrollmentApi.enroll(selectedCourse.value.id)
    submitted.value = true
  } catch (error) {
    console.error('[ApplicationView] application failed:', error)
    submitError.value = error.response?.data?.message || '신청에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadCourses)
</script>

<style scoped>
.page-wrapper { min-height: 100vh; background: var(--color-bg-secondary); }
.application-page { max-width: 1120px; margin: 0 auto; padding: 52px 24px 80px; }
.page-heading { margin-bottom: 30px; }
.step-label { display: inline-block; color: var(--color-primary); font-size: 13px; font-weight: 700; margin-bottom: 8px; }
.page-heading h1 { font-size: 30px; line-height: 1.35; margin-bottom: 8px; }
.page-heading p { color: var(--color-text-secondary); font-size: 15px; }
.application-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; align-items: start; }
.program-panel, .summary-card, .state-card { background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
.program-panel { padding: 24px; }
.panel-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.panel-title h2, .summary-card h2 { font-size: 18px; }
.panel-title span { color: var(--color-text-muted); font-size: 13px; }
.program-list { display: flex; flex-direction: column; gap: 10px; }
.program-card { width: 100%; display: grid; grid-template-columns: 20px 1fr auto; gap: 14px; align-items: center; padding: 18px; text-align: left; background: #fff; border: 1.5px solid var(--color-border); border-radius: var(--radius-md); transition: var(--transition); }
.program-card:hover { border-color: var(--color-secondary); box-shadow: var(--shadow-sm); }
.program-card.selected { border-color: var(--color-primary); background: var(--color-primary-light); }
.program-radio { width: 18px; height: 18px; border: 2px solid var(--color-border-hover); border-radius: 50%; }
.selected .program-radio { border: 5px solid var(--color-primary); background: #fff; }
.program-content { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
.program-content strong { font-size: 15px; }
.program-content small { color: var(--color-text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
.program-price { font-size: 14px; font-weight: 700; white-space: nowrap; }
.summary-card { padding: 24px; position: sticky; top: 88px; }
.summary-card h2 { padding-bottom: 18px; border-bottom: 1px solid var(--color-border); }
.summary-card dl { padding: 10px 0; }
.summary-card dl div { display: flex; justify-content: space-between; gap: 16px; padding: 9px 0; font-size: 13px; }
.summary-card dt { color: var(--color-text-muted); }
.summary-card dd { text-align: right; font-weight: 600; }
.notice { padding: 12px; margin: 6px 0 16px; border-radius: var(--radius-md); background: var(--color-bg-tertiary); color: var(--color-text-secondary); font-size: 12px; line-height: 1.6; }
.submit-button { width: 100%; justify-content: center; }
.submit-button:disabled { opacity: .55; cursor: not-allowed; transform: none; }
.select-guide, .empty-programs { padding: 42px 12px; text-align: center; color: var(--color-text-muted); font-size: 14px; }
.state-card { min-height: 240px; display: flex; flex-direction: column; gap: 14px; align-items: center; justify-content: center; color: var(--color-text-secondary); }
.error-state span { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: #fee2e2; color: var(--color-danger); font-weight: 700; }
.submit-message { margin-top: 12px; font-size: 13px; }
.error-message { color: var(--color-danger); }
.success-box { display: flex; flex-direction: column; gap: 4px; margin-top: 14px; padding: 14px; border-radius: var(--radius-md); background: var(--color-success-light); color: var(--color-success); font-size: 13px; }
.success-box a { margin-top: 5px; font-weight: 700; }
.mock-label { margin-top: 5px; font-size: 12px; opacity: .8; }
@media (max-width: 800px) {
  .application-page { padding-top: 32px; }
  .application-layout { grid-template-columns: 1fr; }
  .summary-card { position: static; }
  .program-card { grid-template-columns: 20px 1fr; }
  .program-price { grid-column: 2; }
}
</style>

<template>
  <div class="page-wrapper">
    <AppHeader />

    <main class="application-page">
      <div class="page-heading fade-in-up">
        <span class="step-label">지원 신청</span>
        <h1>지원 사업 신청</h1>
        <p>선택한 사업 정보를 확인하고 신청을 완료해 주세요.</p>
      </div>

      <div class="application-layout fade-in">
        <section class="program-panel">
          <div class="program-heading">
            <span class="badge badge-blue">{{ program.category }}</span>
            <h2>{{ program.title }}</h2>
            <p>{{ program.description }}</p>
          </div>

          <dl class="program-details">
            <div><dt>사업 번호</dt><dd>#{{ program.id }}</dd></div>
            <div><dt>모집 기간</dt><dd>{{ program.applicationPeriod }}</dd></div>
            <div><dt>지원 대상</dt><dd>{{ program.target }}</dd></div>
            <div><dt>지원 내용</dt><dd>{{ program.benefit }}</dd></div>
          </dl>

          <div class="source-notice">
            이 영역은 분야별 탐색 API에서 전달받은 사업 정보를 표시합니다.
          </div>
        </section>

        <aside class="summary-card">
          <h2>신청 내용 확인</h2>
          <dl>
            <div><dt>신청자</dt><dd>{{ applicantName }}</dd></div>
            <div><dt>지원 사업</dt><dd>{{ program.title }}</dd></div>
            <div><dt>분야</dt><dd>{{ program.category }}</dd></div>
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
import { computed, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { enrollmentApi } from '@/api/enrollment.js'
import { useAuthStore } from '@/store/auth.js'

const auth = useAuthStore()
const submitting = ref(false)
const submitted = ref(false)
const submitError = ref('')

// TODO: 3번 분야별 탐색 API 연동 완료 후, 라우트로 전달받은 실제 사업 정보로 교체한다.
const program = {
  id: 9001,
  title: '청년 디지털 역량 강화 지원사업',
  description: '디지털 분야 취업을 준비하는 청년을 위한 실무 교육 지원 프로그램입니다.',
  category: 'IT·디지털',
  applicationPeriod: '2026.08.01 ~ 2026.09.30',
  target: '만 19세 이상 34세 이하 미취업 청년',
  benefit: '교육비 전액 및 프로젝트 활동비 지원'
}

const applicantName = computed(() => auth.user?.name || '홍길동 (모킹)')

async function submitApplication() {
  if (submitting.value) return
  submitting.value = true
  submitError.value = ''
  try {
    if (!auth.isAuthenticated) {
      await new Promise(resolve => setTimeout(resolve, 400))
      submitted.value = true
      return
    }

    await enrollmentApi.enroll(program.id)
    submitted.value = true
  } catch (error) {
    console.error('[ApplicationView] application failed:', error)
    submitError.value = error.response?.data?.message || '신청에 실패했습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    submitting.value = false
  }
}
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
.program-panel { padding: 28px; }
.program-heading { padding-bottom: 24px; border-bottom: 1px solid var(--color-border); }
.program-heading h2 { margin: 12px 0 8px; font-size: 23px; }
.program-heading p { color: var(--color-text-secondary); line-height: 1.75; }
.program-details { padding: 18px 0; }
.program-details div { display: grid; grid-template-columns: 110px 1fr; gap: 20px; padding: 12px 0; font-size: 14px; }
.program-details dt { color: var(--color-text-muted); }
.program-details dd { font-weight: 600; }
.source-notice { padding: 12px 14px; border-radius: var(--radius-md); background: var(--color-primary-light); color: var(--color-primary); font-size: 12px; }
.summary-card { padding: 24px; position: sticky; top: 88px; }
.summary-card h2 { padding-bottom: 18px; border-bottom: 1px solid var(--color-border); }
.summary-card dl { padding: 10px 0; }
.summary-card dl div { display: flex; justify-content: space-between; gap: 16px; padding: 9px 0; font-size: 13px; }
.summary-card dt { color: var(--color-text-muted); }
.summary-card dd { text-align: right; font-weight: 600; }
.notice { padding: 12px; margin: 6px 0 16px; border-radius: var(--radius-md); background: var(--color-bg-tertiary); color: var(--color-text-secondary); font-size: 12px; line-height: 1.6; }
.submit-button { width: 100%; justify-content: center; }
.submit-button:disabled { opacity: .55; cursor: not-allowed; transform: none; }
.submit-message { margin-top: 12px; font-size: 13px; }
.error-message { color: var(--color-danger); }
.success-box { display: flex; flex-direction: column; gap: 4px; margin-top: 14px; padding: 14px; border-radius: var(--radius-md); background: var(--color-success-light); color: var(--color-success); font-size: 13px; }
.success-box a { margin-top: 5px; font-weight: 700; }
.mock-label { margin-top: 5px; font-size: 12px; opacity: .8; }
@media (max-width: 800px) {
  .application-page { padding-top: 32px; }
  .application-layout { grid-template-columns: 1fr; }
  .summary-card { position: static; }
  .program-details div { grid-template-columns: 90px 1fr; }
}
</style>

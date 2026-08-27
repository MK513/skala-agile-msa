<template>
  <div class="page-wrapper">
    <AppHeader />
    <div class="page-layout">
      <main class="main-content">
        <h1 class="page-title">교부 내역</h1>
        <p class="page-desc">선정 확정된 지원사업의 교부 확정 내역입니다. 신청이 승인되면 교부 결정번호가 발급되고 신청 상태가 <strong>선정 확정</strong>으로 전환됩니다.</p>

        <!-- 요약 (집행 실적) -->
        <div v-if="!loading && !error && payments.length" class="summary-row">
          <div class="summary-card">
            <span class="summary-label">교부 확정 건수</span>
            <span class="summary-value">{{ completedPayments.length }}건</span>
          </div>
          <div class="summary-card">
            <span class="summary-label">교부 확정 총액</span>
            <span class="summary-value">{{ formatAmount(totalAmount) }}</span>
          </div>
        </div>

        <div v-if="loading" class="state-box">교부 내역을 불러오는 중입니다...</div>

        <div v-else-if="error" class="state-box state-error">{{ error }}</div>

        <div v-else-if="!payments.length" class="state-box">
          <p>아직 교부 내역이 없습니다.</p>
          <p class="state-sub">지원사업을 신청하면 심사 후 교부가 확정됩니다.</p>
          <router-link to="/courses" class="btn btn-primary">지원사업 둘러보기</router-link>
        </div>

        <!-- 교부 내역 테이블 -->
        <div v-else class="table-card">
          <table class="payment-table">
            <thead>
              <tr>
                <th>지원사업</th>
                <th>교부 확정액</th>
                <th>교부 결정번호</th>
                <th>상태</th>
                <th>확정 일시</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in payments" :key="p.paymentId">
                <td class="td-title">
                  <router-link :to="`/courses/${p.courseId}`" class="course-link">
                    {{ courseTitle(p.courseId) }}
                  </router-link>
                </td>
                <td class="td-amount">{{ formatAmount(p.amount) }}</td>
                <td class="td-txid" :title="p.transactionId">{{ shortTxId(p.transactionId) }}</td>
                <td>
                  <span class="badge" :class="statusMeta(p.status).badgeClass">{{ statusMeta(p.status).label }}</span>
                </td>
                <td class="td-date">{{ formatDate(p.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { useAuthStore } from '@/store/auth.js'
import { paymentApi } from '@/api/payment.js'
import { courseApi } from '@/api/course.js'

const auth = useAuthStore()

const payments = ref([])
const courseMap = ref({})
const loading = ref(true)
const error = ref('')

// 결제 상태 → 교부 도메인 표기 (enum 값은 백엔드 원본 유지)
const STATUS_META = {
  COMPLETED: { label: '교부 확정',   badgeClass: 'badge-teal'  },
  PENDING:   { label: '처리 중',     badgeClass: 'badge-amber' },
  FAILED:    { label: '교부 실패',   badgeClass: 'badge-pink'  },
  CANCELLED: { label: '교부 취소',   badgeClass: 'badge-gray'  }
}

function statusMeta(status) {
  return STATUS_META[status] ?? { label: status, badgeClass: 'badge-gray' }
}

const completedPayments = computed(() => payments.value.filter(p => p.status === 'COMPLETED'))
const totalAmount = computed(() =>
  completedPayments.value.reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
)

function courseTitle(courseId) {
  return courseMap.value[courseId] ?? `지원사업 #${courseId}`
}

function formatAmount(amount) {
  const won = Number(amount)
  if (!Number.isFinite(won)) return '-'
  return `₩${won.toLocaleString()}`
}

function shortTxId(txId) {
  if (!txId) return '-'
  return txId.length > 8 ? `${txId.slice(0, 8)}…` : txId
}

function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(async () => {
  const userId = auth.user?.id
  if (!userId) {
    error.value = '사용자 정보를 확인할 수 없습니다. 다시 로그인해주세요.'
    loading.value = false
    return
  }

  try {
    // 교부 내역과 사업 목록(사업명 매핑용)을 병렬 조회
    const [payRes, courseRes] = await Promise.all([
      paymentApi.getByUser(userId),
      courseApi.getCourses().catch(() => null)
    ])

    const list = payRes?.data?.data ?? payRes?.data ?? []
    payments.value = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const courses = courseRes?.data?.data ?? courseRes?.data ?? []
    courseMap.value = Object.fromEntries(courses.map(c => [c.id, c.title]))
  } catch (e) {
    console.error('[PaymentView] 교부 내역 조회 실패:', e)
    error.value = '교부 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: var(--color-bg-secondary);
}

.page-layout {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.sidebar { display: flex; flex-direction: column; gap: 8px; }
.sidebar-section { display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px; }
.sidebar-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding: 8px 12px 4px;
}
.sidebar-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: var(--transition);
  text-decoration: none;
}
.sidebar-item:hover { background: var(--color-bg-tertiary); color: var(--color-text-primary); }
.sidebar-item.active { background: var(--color-primary-light); color: var(--color-primary); font-weight: 500; }
.si-icon { font-size: 15px; }

.main-content { min-width: 0; }
.page-title { font-size: 24px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 8px; }
.page-desc { font-size: 14px; color: var(--color-text-secondary); margin-bottom: 24px; word-break: keep-all; }

/* 요약 카드 */
.summary-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 240px));
  gap: 12px;
  margin-bottom: 20px;
}
.summary-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.summary-label { font-size: 12px; color: var(--color-text-secondary); }
.summary-value { font-size: 22px; font-weight: 700; color: var(--color-primary); }

/* 상태/빈 화면 */
.state-box {
  background: var(--color-bg-primary);
  border: 1px dashed var(--color-border-hover);
  border-radius: var(--radius-lg);
  padding: 48px 24px;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.state-sub { font-size: 13px; color: var(--color-text-muted); }
.state-error { border-color: #fecaca; color: var(--color-danger); }

/* 테이블 */
.table-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow-x: auto;
}
.payment-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.payment-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  white-space: nowrap;
}
.payment-table td {
  padding: 13px 16px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}
.payment-table tbody tr:last-child td { border-bottom: none; }
.payment-table tbody tr:hover { background: var(--color-bg-secondary); }

.td-title { font-weight: 500; color: var(--color-text-primary); }
.course-link { color: inherit; }
.course-link:hover { color: var(--color-primary); text-decoration: underline; }
.td-amount { font-weight: 600; color: var(--color-primary); white-space: nowrap; }
.td-txid {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.td-date { font-size: 13px; color: var(--color-text-secondary); white-space: nowrap; }

/* 반응형 */
@media (max-width: 860px) {
  .page-layout { grid-template-columns: 1fr; }
  .sidebar { flex-direction: row; flex-wrap: wrap; }
  .sidebar-section { flex-direction: row; flex-wrap: wrap; margin-bottom: 0; }
  .sidebar-label { display: none; }
  .summary-row { grid-template-columns: 1fr 1fr; }
}
</style>

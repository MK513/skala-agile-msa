# 프론트엔드 개발 환경 & 인증 흐름

> #1(회원가입·로그인) 담당 정리. 작업 시작 전 필독.

---

## 1. 방향 확정 — Vue 템플릿 수정

- 가이드의 HTML/JS(fetch) 방식 → **사용 불가**
- 사유
  - 로그인이 단순 REST 아님. **OAuth2 Authorization Code + PKCE**
  - redirect_uri가 `http://localhost:3000/callback`으로 auth-server에 **고정 등록** (변경 불가)
- 결론: `vue-frontend`에 이미 구현·검증 완료 → **로그인 재작성 X, 화면 문구·기능만 수정**

---

## 2. 실행

```bash
git clone [저장소 주소]
cd skala-agile-msa/vue-frontend
npm install
npm run dev
```

접속: `http://localhost:3000`

### 주의

- **:3000 고정** — 다른 포트 로그인 실패. 8090 컨테이너 사용 금지
- 포트 사용 중 에러 → `lsof -ti:3000 | xargs kill -9`
- macOS 보안 팝업 → **"완료"** 클릭 (휴지통 X) → `xattr -dr com.apple.quarantine node_modules`
- 백엔드 컨테이너는 `~/msa-lecture`에서 실행. git 저장소에서 `docker compose up` 금지 (포트 충돌)
- 로그 확인: `cd ~/msa-lecture && docker compose logs -f enrollment-service`

---

## 3. 계정 · 로그인

### 초기 계정 사용 불가

- `student@lecture.com`, `instructor@lecture.com` — DB에 존재
- 비밀번호 BCrypt 해시로만 저장 → **확인 불가**. 시도 실패

### 계정 생성 — 각자 등록

**A. 회원가입 화면 (권장)**
- `http://localhost:3000/register`
- 가입 유형: **신청자** = 사업 조회·신청 테스트 / **기관** = 사업 등록 테스트 (등록은 기관 권한만 가능)

**B. Swagger**
- `http://localhost:8081/swagger-ui/index.html` → `POST /api/users/register`
```json
{ "email": "이메일", "password": "비밀번호", "name": "이름", "role": "STUDENT" }
```
- role: `STUDENT`(신청자) / `INSTRUCTOR`(기관)

### 로그인 흐름

- 로그인 버튼 → `localhost:8080/login` 이동 → 가입 정보 입력 → `/callback` 경유 복귀
- **"Please sign in" 화면은 auth-server 제공. 수정 불가**
- 입력 없이 바로 로그인됨 = 이전 세션 유지. 정상
  - 다른 계정 테스트: 시크릿 창 또는 `http://localhost:8080/connect/logout`

---

## 4. API 호출 규칙

- 모든 호출 **Gateway(8080)** 경유. 8081~8085 직접 호출 → CORS 실패
- 토큰 직접 처리 X. `src/api/` 기존 axios 인스턴스 사용 → 헤더 자동 첨부
  - 새 axios·생 fetch 생성 시 인증 누락 → 401
- 401 = 토큰 만료 → 재로그인
- role 값은 원본 유지 (`STUDENT`/`INSTRUCTOR`). 화면 라벨만 한글

---

## 5. 도메인 매핑 (화면 표기만)

API 경로·enum **변경 없음**

| 원본 | 표기 |
|---|---|
| 강사 / INSTRUCTOR | 기관 (지자체·수행기관) |
| 수강생 / STUDENT | 신청자 (기업·주민) |
| 강의 · 과목 | 지원사업 |
| 수강신청 | 지원 신청 |
| 결제 | 교부 확정 |
| PENDING | 심사 대기 |
| ACTIVE | 선정 확정 |

---

## 6. 담당 파일

- 브랜치: `feat/기능명` → 작업 후 main으로 PR
- **담당 외 파일 수정 금지** (충돌 방지)

| 담당 | 기능 | 파일 |
|---|---|---|
| #1 | 회원가입·로그인 | `RegisterView.vue`(신규), `LoginView.vue`, `CallbackView.vue`, `LandingView.vue`, 공통 헤더 |
| #2·#3 | 사업 등록·목록·탐색 | `CourseListView.vue`, `CourseDetailView.vue`, `CourseCreateView.vue` |
| #4·#5 | 지원 신청·신청 현황 | `EnrollmentView.vue`, `MyPageView.vue` |

- 공통 파일(`src/router/`, `src/store/`, `src/api/`) 수정 필요 시 사전 공유

---

## 7. 현재 상태

- ✅ 로그인(OAuth2) 흐름 동작 확인
- ✅ 회원가입 화면(`/register`) 구현 — 가입 → 로그인 → 사업 목록 이동 확인
- ✅ 로그인 화면·헤더 도메인 문구 적용
- ⬜ 나머지 화면 각 담당 작업 예정

---

## 8. 질문 요령

- ❌ "Eureka 설정이 왜 이래요?"
- ✅ "이 API에 이렇게 호출했는데 이런 응답이 옵니다"
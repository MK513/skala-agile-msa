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
- 중간의 계정 입력 화면은 **auth-server(백엔드)가 렌더링** — 프론트 코드 아님. 현재 브랜딩 적용됨 (→ 7번 참고)
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

## 7. 백엔드 수정 내역 — auth-server 로그인 화면 브랜딩

> 유일한 백엔드 변경. **코드·jar·로직은 일절 수정하지 않음** — 스타일시트 1개만 오버레이.

### 문제

- 로그인 계정 입력 화면이 Spring Security 기본 페이지("Please sign in", 영문, 무브랜딩)
- auth-server는 **소스 없이 강사 제공 Docker 이미지로만 존재** → 코드 수정·재빌드 불가

### 해결 방식 (이미지 오버레이)

- Spring Security 6.4는 기본 로그인 페이지의 CSS(`/default-ui.css`)를 **클래스패스에서** 로드함
- 원본 이미지 위에 레이어 하나만 얹은 파생 이미지를 만들고, 커스텀 CSS 디렉터리(`/overlay`)를 클래스패스 **앞에** 추가
  → 클래스로더가 우리 CSS를 먼저 발견 → 기본 CSS 대체
- 관련 파일: `auth-server-branding/Dockerfile`, `auth-server-branding/default-ui.css`

### 바뀐 것 (CSS만으로 처리)

| 항목 | before → after |
|---|---|
| 배경 | 회색 → 프론트와 동일한 블루 그라데이션(#185FA5 계열) |
| 타이틀 | "Please sign in" → "지원나침반 / 통합 로그인" (가상요소 치환) |
| 입력 라벨 | 없음(영문 placeholder) → "이메일" / "비밀번호" 한글 라벨 |
| 버튼 | "Sign in" → "로그인", 브랜드 컬러 |
| 에러 문구 | "Bad credentials" → "이메일 또는 비밀번호가 올바르지 않습니다." |

### 팀원 적용 방법 (clone만 받은 경우 안 보임 — 로컬 이미지 재빌드 필요)

```bash
docker tag msa-lecture/auth-server:1.0 msa-lecture/auth-server:1.0-orig
```

```bash
docker build -t msa-lecture/auth-server:1.0 ./auth-server-branding
```

```bash
docker compose -f ~/msa-lecture/docker-compose.yml up -d --force-recreate auth-server
```

### 되돌리기

```bash
docker tag msa-lecture/auth-server:1.0-orig msa-lecture/auth-server:1.0
```

```bash
docker compose -f ~/msa-lecture/docker-compose.yml up -d --force-recreate auth-server
```

### 왜 이 방식인가

- auth-server·api-gateway·eureka는 **수정 금지 대상** → 소스 변경 없이 겉모습만 바꾸는 최소 침습 방식
- 인증 로직·토큰 발급·엔드포인트 동작은 **원본과 100% 동일** (CSS 파일 하나 차이)
- 원본 이미지는 `1.0-orig` 태그로 백업되어 있어 언제든 즉시 복구 가능

---

## 8. 현재 상태

- ✅ 로그인(OAuth2) 흐름 동작 확인
- ✅ 회원가입 화면(`/register`) 구현 — 가입 → 로그인 → 사업 목록 이동 확인 (실계정 E2E 검증)
  - 필드별 검증(이메일 형식·비밀번호 8자·확인 일치), 역할 카드 선택 UI, 로딩·성공/실패 피드백, 모바일 반응형
- ✅ 로그인 화면·헤더 도메인 문구 적용 (서비스명은 `src/constants/brand.js` 상수 — 이름 확정 시 여기만 수정)
- ✅ auth-server 로그인 화면 브랜딩 (7번 참고)
- ⬜ 나머지 화면 각 담당 작업 예정

---

## 9. 질문 요령

- ❌ "Eureka 설정이 왜 이래요?"
- ✅ "이 API에 이렇게 호출했는데 이런 응답이 옵니다"
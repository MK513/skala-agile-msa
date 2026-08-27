당신은 Vue.js 및 Vanilla HTML/JS 기반 프론트엔드 개발자입니다.
정부 지원 대행 종합 서비스의 3가지 핵심 화면(등록, 목록/탐색, 상세)을 구현하는 코드를 작성해주세요.

[공통 요구사항 및 제약조건]
1. Base URL: 모든 API 요청은 API Gateway인 `http://localhost:8080`을 통해 호출해야 합니다.
2. 인증 헤더: 인증이 필요한 요청은 `sessionStorage.getItem("token")`에서 토큰을 가져와 `Authorization: Bearer ${token}` 헤더를 포함해야 하며, 401 에러 발생 시 로그인 페이지(`login.html`)로 리다이렉트합니다.
3. 디자인: 과도한 스타일링 없이 직관적이고 시연 가능한 심플한 CSS/구조로 작성해주세요.
4. 도메인 매핑:
   - Course = 지원사업
   - Price = 지원 한도액 (원)
   - Category = EMPLOYMENT, RND, EXPORT, FACILITY, HOUSING, YOUTH, STARTUP, OTHER
   - Enrollment = 지원 신청 (POST /api/enrollments)

---

### 1. 지원사업 등록 페이지 (`course-create.html` 또는 등록 컴포넌트)
- **API 연동**: `POST http://localhost:8080/api/courses` (인증 토큰 필수)
- **사용자 역할**: 지자체·수행기관(AGENCY)
- **입력 필드**:
  - 사업명 (title)
  - 사업 설명 (description)
  - 지원 분야 (category: EMPLOYMENT, RND, EXPORT, FACILITY, HOUSING, YOUTH, STARTUP, OTHER 중 드롭다운 선택)
  - 지원 한도액 (price: 숫자 입력)
- **동작 흐름**:
  - 폼 제출 시 JSON 형식으로 `POST /api/courses` 호출
  - 등록 성공 시 목록 페이지(`course-list.html`)로 이동

---

### 2. 지원사업 목록/탐색 페이지 (`course-list.html` 또는 목록 컴포넌트)
- **API 연동**:
  - 전체 목록: `GET http://localhost:8080/api/courses` (인증 불필요)
  - 분야별 필터: `GET http://localhost:8080/api/courses/category/{category}` (인증 불필요)
- **화면 구성**:
  - 상단 분야별 탭 버튼: [전체, 고용(EMPLOYMENT), R&D(RND), 수출(EXPORT), 설비(FACILITY), 주거(HOUSING), 청년(YOUTH), 창업(STARTUP), 기타(OTHER)]
  - 지원사업 카드/테이블 리스트: 사업명, 카테고리, 지원 한도액(price), 신청 건수(enrollmentCount) 표시
- **동작 흐름**:
  - 페이지 로드 시 전체 목록 API 호출 및 렌더링
  - 탭 클릭 시 선택된 카테고리 엔드포인트(`GET /api/courses/category/{category}`)를 호출하여 리스트 갱신 (전체 탭 클릭 시 `GET /api/courses` 호출)
  - 각 사업 아이템 클릭 시 상세 페이지(`course-detail.html?id={id}`)로 이동

---

### 3. 지원사업 상세 및 신청 페이지 (`course-detail.html` 또는 상세 컴포넌트)
- **API 연동**:
  - 사업 상세 조회: `GET http://localhost:8080/api/courses/{id}` (인증 불필요)
  - 지원 신청하기: `POST http://localhost:8080/api/enrollments` (인증 토큰 필수)
- **화면 구성**:
  - URL 파라미터(`id`)를 통해 상세 데이터 로드 후 사업명, 카테고리, 지원 한도액, 상세 설명 표시
  - 하단 [지원 신청하기] 버튼
- **동작 흐름**:
  - [지원 신청하기] 버튼 클릭 시 토큰 유무 확인 (미로그인 시 안내 후 로그인 이동)
  - `POST /api/enrollments`로 `{"courseId": id}` 전송
  - 응답의 `status: "PENDING"`(심사 대기) 수신 시 "신청이 완료되었습니다 (심사 대기)" 알림 후 마이페이지/신청 현황 화면(`my-enrollments.html`)으로 이동

위 요구사항을 충족하는 완전한 HTML/JS (또는 Vue SFC) 코드를 작성해주세요.
추가로 테스트를 위해 홈 페이지에 해당 페이지 들로 이동할 수 있는 버튼을 만들어주세요.

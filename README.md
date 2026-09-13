# 기프티 (Gifty) — 모바일 상품권 발행/구매/선물/사용 플랫폼

(주)티켓나라 채용공고 기반 학습 프로젝트. 상품권 유통의 전체 라이프사이클
(발행 → 구매 → 선물 → 사용/소진 → 정산)을 실제 서비스와 유사하게 구현합니다.

## 기술 스택

| 영역 | 기술 |
|---|---|
| 백엔드 | Node.js, Express, Sequelize (ORM) |
| DB | PostgreSQL |
| 인증 | JWT + (선택) 카카오 소셜 로그인 |
| 결제 | 포트원(아임포트) 테스트 연동 |
| 프론트엔드 | Vue 3, Vite, Pinia, Vue Router |
| 인프라 | Docker, Docker Compose, GitHub Actions(CI/CD) |

## 폴더 구조

```
gifty/
├── backend/                # Node.js + Express API 서버
│   ├── src/
│   │   ├── config/         # DB 연결, 환경설정
│   │   ├── models/         # Sequelize 모델 (도메인 엔티티)
│   │   ├── routes/         # API 라우트 정의
│   │   ├── controllers/    # 요청 처리 로직
│   │   ├── services/       # 결제/정산 등 비즈니스 로직
│   │   ├── middlewares/    # 인증, 에러 핸들링
│   │   └── utils/          # 로거 등 공통 유틸
│   ├── package.json
│   └── Dockerfile
├── frontend/                # Vue 3 SPA
│   ├── src/
│   │   ├── views/          # 페이지 컴포넌트
│   │   ├── components/     # 재사용 컴포넌트
│   │   ├── store/          # Pinia 스토어
│   │   └── router/         # 라우팅 설정
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml       # 로컬 통합 개발 환경 (DB+백엔드+프론트)
└── README.md
```

## 도메인 모델 (ERD 요약)

- **User** — 구매자/수신자 (일반 회원, 관리자 role 포함)
- **GiftCard** — 상품권 마스터 정보 (상품명, 금액, 유효기간, 가맹점)
- **GiftCardInstance** — 개별 발행 코드 (상태: ISSUED / SOLD / GIFTED / USED / EXPIRED)
- **Order** — 구매 주문 및 결제 상태
- **Gift** — 선물 발송 내역 (발신자 → 수신자)
- **Transaction** — 사용(소진) 내역
- **Settlement** — 가맹점 정산 배치 데이터

## 로드맵 (6주)

1. **1주차** — ERD/API 설계, 회원가입·로그인(JWT), 소셜 로그인
2. **2주차** — 상품권 구매(결제 연동), 발행 코드 생성 로직
3. **3주차** — 선물하기, 사용 처리(동시성 제어), 관리자 API
4. **4주차** — 정산 배치(cron), 에러 핸들링/로깅, 장애 대응 문서화
5. **5주차** — Vue 프론트엔드 완성 (사용자/관리자 화면)
6. **6주차** — Docker/CI-CD 구성, AWS 배포, 트러블슈팅 문서 정리

## 시작하기

```bash
# 1. 환경변수 설정
cp backend/.env.example backend/.env

# 2. Docker Compose로 전체 스택 실행 (DB + 백엔드 + 프론트)
docker-compose up --build

# 백엔드: http://localhost:4000
# 프론트: http://localhost:5173
```

로컬에서 직접 실행하려면 `backend/README` 및 `frontend/README` 섹션을 참고하세요.

# 기프티 (Gifty) — 모바일 상품권 발행/구매/선물/사용 플랫폼

상품권 유통의 전체 라이프사이클 (발행 → 구매 → 선물 → 사용/소진 → 정산)을 실제 서비스와 유사하게 구현하고,
**실제 PG 연동 및 대규모 동시 요청 상황에서의 정합성**까지 직접 검증했습니다.

## 핵심 어필 포인트

- **실제 PG API 연동**: 포트원(PortOne) V2로 실제 카드 결제 → 서버 사이드 재검증까지 End-to-End 완주
- **동시성/정합성 제어**: 재고 한정 상품권에 `SELECT ... FOR UPDATE` 행 잠금 적용, 재고 5개에 동시 요청 20건을 쏴도 오버셀 0건 (수동 부하테스트 + Jest 자동화 테스트로 각각 검증)
- **결제 멱등성**: DB UNIQUE 제약 + 애플리케이션 레벨 체크 이중 방어로, 같은 결제 건이 중복 요청돼도 주문이 중복 생성되지 않음
- **웹훅 안전망**: PG 서버의 비동기 결제 완료 통지를 멱등하게 처리하는 엔드포인트 구현
- **CI**: GitHub Actions로 push/PR마다 Jest 테스트 + 프론트 빌드 자동 검증

## 기술 스택

| 영역 | 기술 |
|---|---|
| 백엔드 | Node.js, Express, Sequelize (ORM) |
| DB | PostgreSQL |
| 인증 | JWT |
| 결제 | 포트원(PortOne) V2 REST API + Browser SDK |
| 프론트엔드 | Vue 3, Vite, Pinia, Vue Router |
| 테스트 | Jest, Supertest |
| 인프라 | Docker, Docker Compose, GitHub Actions(CI) |

## 폴더 구조

```
gifty/
├── backend/
│   ├── src/
│   │   ├── config/         # DB 연결
│   │   ├── models/         # Sequelize 모델 (User, GiftCard, GiftCardInstance, Order, Gift, Transaction, Settlement)
│   │   ├── routes/         # API 라우트
│   │   ├── controllers/    # 요청 처리 로직
│   │   ├── services/       # 결제(payment), 정산(settlement) 비즈니스 로직
│   │   ├── middlewares/    # 인증, 에러 핸들링
│   │   └── utils/          # 로거
│   ├── tests/               # Jest 테스트 (동시성, 멱등성)
│   ├── scripts/             # 수동 부하테스트 스크립트
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── views/           # 페이지 컴포넌트 (상품권/선물함(탭)/관리자 등)
│   │   ├── components/
│   │   ├── store/           # Pinia 스토어
│   │   └── router/
│   ├── package.json
│   └── Dockerfile
├── .github/workflows/ci.yml # GitHub Actions CI
├── docker-compose.yml
└── README.md
```

## 도메인 모델 (ERD 요약)

- **User** — 구매자/수신자 (일반 회원, 관리자 role 포함)
- **GiftCard** — 상품권 마스터 정보 (상품명, 금액, 유효기간, 재고)
- **GiftCardInstance** — 개별 발행 코드 (상태: ISSUED / SOLD / GIFTED / USED / EXPIRED)
- **Order** — 구매 주문 및 결제 상태 (`pgTransactionId`에 UNIQUE 제약 → 결제 멱등성의 핵심)
- **Gift** — 선물 발송 내역 (발신자 → 수신자)
- **Transaction** — 사용(소진) 내역, 가맹점 정산의 기준 데이터
- **Settlement** — 가맹점 정산 배치 데이터

## 동시성/정합성 설계 상세

### 1) 재고 오버셀 방지
`GiftCard.totalStock`이 설정된 한정 수량 상품권은, 구매 트랜잭션 안에서
`SELECT ... FOR UPDATE`로 해당 행을 잠근 뒤 재고를 확인·차감합니다.
트랜잭션이 끝날 때까지 다른 요청은 이 락이 풀리길 기다리므로, 동시에 N명이
몰려도 재고보다 많이 팔리는 오버셀이 발생하지 않습니다.

**검증 결과**: 재고 5개 상품에 동시 요청 20건 → 정확히 5건만 성공, 나머지 15건은
"재고가 부족합니다" 응답. `backend/scripts/concurrency-test.js`로 재현 가능.

### 2) 결제 멱등성
같은 `impUid`(결제 고유번호)로 요청이 두 번 들어와도(네트워크 재시도, 이중 클릭,
클라이언트 콜백과 PG 웹훅이 동시에 도착하는 경우 등) 새 주문을 만들지 않고
기존 주문을 그대로 반환합니다. `Order.pgTransactionId` UNIQUE 제약이 최후 방어선이고,
애플리케이션 레벨에서도 선제적으로 중복을 체크합니다.

### 3) 실제 PG 연동
`payment.service.js`는 포트원 V2 REST API로 결제 상태·금액·주문번호를 서버
사이드에서 재검증합니다. 클라이언트가 "성공했다"고 보내는 값을 그대로 믿지 않고,
PG 서버에 직접 재조회해서 확인하는 구조입니다. `PORTONE_V2_API_SECRET`이 없으면
자동으로 mock 모드로 동작해서, PG 계정 없이도 로직 개발/테스트가 가능합니다.

## 로드맵 진행 현황

- [x] 1주차 — ERD/API 설계, 회원가입·로그인(JWT)
- [x] 2주차 — 상품권 구매(PG 실연동), 발행 코드 생성 로직
- [x] 3주차 — 선물하기, 사용 처리(동시성 제어), 관리자 API
- [x] 4주차 — 정산 배치, 에러 핸들링/로깅
- [x] 5주차 — Vue 프론트엔드 (사용자/관리자 화면)
- [x] Jest 자동화 테스트 (동시성/멱등성)
- [x] GitHub Actions CI
- [ ] AWS 배포 (다음 단계)

## 시작하기

```bash
# 1. 환경변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# backend/.env, frontend/.env는 비워둬도 mock 모드로 정상 동작합니다.
# 실제 PG 연동을 테스트하려면 포트원 V2 콘솔에서 발급받은 키를 채워주세요.

# 2. Docker Compose로 전체 스택 실행 (DB + 백엔드 + 프론트)
docker-compose up --build

# 3. 샘플 데이터 시딩 (상품권 + 관리자 계정)
docker-compose exec backend node src/seed.js
```

- 백엔드: http://localhost:4000 (docker-compose 포트 매핑에 따라 다를 수 있음)
- 프론트: http://localhost:5173
- 관리자 계정: `admin@gifty.com` / `admin1234`

## 테스트

```bash
# devDependencies 설치 (최초 1회, 이미지가 --omit=dev로 빌드되어 있어서 필요)
docker-compose exec backend npm install

# Jest 테스트 실행 (동시성/멱등성 자동 검증)
docker-compose exec backend npm test

# 수동 부하테스트 (재고 오버셀 여부를 눈으로 직접 확인하고 싶을 때)
docker-compose exec backend node scripts/concurrency-test.js
# 시나리오 조절: STOCK=3 CONCURRENCY=50 docker-compose exec -e STOCK=3 -e CONCURRENCY=50 backend node scripts/concurrency-test.js
```

GitHub Actions가 `main` 브랜치 push/PR마다 위 Jest 테스트와 프론트 빌드를
자동으로 실행합니다 (`.github/workflows/ci.yml`).

## 자기소개서/이력서에 바로 쓸 수 있는 포인트

- "재고 한정 상품권에 DB row lock을 적용해 동시 요청 20건 중 재고만큼만 정확히
  판매되도록 구현하고, 이를 Jest 자동화 테스트와 부하테스트 스크립트로 검증"
- "결제 API 연동 시 클라이언트 값을 신뢰하지 않고 PG 서버 재조회로 서버 사이드
  검증하는 구조 설계, DB UNIQUE 제약과 애플리케이션 체크의 이중 방어로 결제
  멱등성 확보"
- "PG 웹훅 엔드포인트를 구현해 클라이언트 콜백 실패 시에도 결제 정합성이
  깨지지 않는 안전망 마련"
- "GitHub Actions로 CI 파이프라인을 구성해 push/PR마다 테스트 자동 실행"

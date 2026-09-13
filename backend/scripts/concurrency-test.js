/**
 * 재고 동시성 제어 검증용 부하 테스트.
 *
 * 재고 N개짜리 상품권을 만들고, 동시에 N보다 많은 구매 요청을 던져서
 * "정확히 N개만 성공하고 나머지는 재고 부족으로 막히는지" 확인한다.
 * 만약 락이 제대로 안 걸려있다면 N개보다 더 많이 팔리는 오버셀이 관찰될 것이다.
 *
 * 실행:
 *   docker-compose exec backend node scripts/concurrency-test.js
 *
 * 환경변수로 시나리오 조절 가능:
 *   STOCK=5 CONCURRENCY=30 docker-compose exec backend node scripts/concurrency-test.js
 */
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const STOCK = Number(process.env.STOCK || 5);
const CONCURRENCY = Number(process.env.CONCURRENCY || 20);

async function registerTestUser(suffix) {
  const email = `loadtest_${suffix}_${Date.now()}@gifty.com`;
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'test1234',
      name: `부하테스트${suffix}`,
      phone: `010${String(Date.now()).slice(-8)}${suffix}`,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`회원가입 실패: ${JSON.stringify(data)}`);
  return data.token;
}

async function loginAdmin() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gifty.com', password: 'admin1234' }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`관리자 로그인 실패: ${JSON.stringify(data)}. 먼저 seed.js를 실행했는지 확인하세요.`);
  return data.token;
}

async function createLimitedStockCard(adminToken) {
  const res = await fetch(`${BASE_URL}/api/admin/gift-cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      merchantName: '부하테스트 가맹점',
      productName: `한정판 상품권 (재고 ${STOCK}개)`,
      faceValue: 1000,
      validDays: 30,
      totalStock: STOCK,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`상품권 생성 실패: ${JSON.stringify(data)}`);
  return data;
}

async function attemptPurchase(token, giftCardId, idx) {
  const impUid = `loadtest_imp_${idx}_${Date.now()}`;
  const res = await fetch(`${BASE_URL}/api/gift-cards/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ giftCardId, quantity: 1, impUid, merchantUid: `loadtest_merchant_${idx}` }),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log(`\n=== 동시성 부하 테스트 시작 (재고 ${STOCK}개, 동시 요청 ${CONCURRENCY}건) ===\n`);

  console.log('1. 관리자 로그인 및 한정 수량 상품권 생성...');
  const adminToken = await loginAdmin();
  const card = await createLimitedStockCard(adminToken);
  console.log(`   생성됨: ${card.productName} (id=${card.id}, remainingStock=${card.remainingStock})`);

  console.log(`2. 테스트용 사용자 ${CONCURRENCY}명 생성 중...`);
  const tokens = await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, i) => registerTestUser(i))
  );
  console.log('   완료');

  console.log(`3. ${CONCURRENCY}건의 구매 요청을 동시에 발사...\n`);
  const results = await Promise.all(
    tokens.map((token, i) => attemptPurchase(token, card.id, i))
  );

  const succeeded = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  console.log(`   성공: ${succeeded.length}건`);
  console.log(`   실패: ${failed.length}건`);
  console.log(`   실패 사유 샘플: ${failed[0]?.data?.message || '(없음)'}\n`);

  console.log('4. 최종 검증...');
  const listRes = await fetch(`${BASE_URL}/api/admin/gift-cards`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const list = await listRes.json();
  const finalCard = list.find((c) => c.id === card.id);

  console.log(`   최종 remainingStock: ${finalCard.remainingStock} (기대값: ${STOCK - succeeded.length})`);

  const isOversold = succeeded.length > STOCK;
  const isConsistent = finalCard.remainingStock === STOCK - succeeded.length;

  console.log('\n=== 결과 ===');
  if (isOversold) {
    console.log(`❌ 오버셀 발생! 재고 ${STOCK}개인데 ${succeeded.length}건이 성공했습니다. 동시성 제어에 버그가 있습니다.`);
  } else if (succeeded.length !== Math.min(STOCK, CONCURRENCY)) {
    console.log(`⚠️  성공 건수(${succeeded.length})가 기대값(${Math.min(STOCK, CONCURRENCY)})과 다릅니다. 로그를 확인하세요.`);
  } else {
    console.log(`✅ 오버셀 없음. 정확히 재고만큼(${succeeded.length}건)만 성공했습니다.`);
  }
  console.log(isConsistent ? '✅ 재고 수치 정합성 일치.' : '❌ 재고 수치가 예상과 다릅니다 - 정합성 문제 의심.');
  console.log('');
}

main().catch((err) => {
  console.error('테스트 실행 중 오류:', err.message);
  process.exit(1);
});

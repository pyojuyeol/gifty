// 테스트는 항상 mock 결제 모드로 동작하도록 강제한다.
// (실제 PORTONE_V2_API_SECRET이 .env에 있으면 가짜 impUid로는 검증에 실패하기 때문)
process.env.PORTONE_V2_API_SECRET = '';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { sequelize, GiftCard, User, Order, GiftCardInstance } = require('../src/models');

describe('재고 동시성 제어', () => {
  const STOCK = 5;
  const CONCURRENCY = 20;
  let giftCard;
  let adminToken;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync(); // CI처럼 서버를 미리 띄우지 않은 환경에서는 테이블이 없으므로 직접 생성

    await User.findOrCreate({
      where: { email: 'jest_admin@gifty.com' },
      defaults: {
        email: 'jest_admin@gifty.com',
        passwordHash: await bcrypt.hash('test1234', 10),
        name: 'Jest관리자',
        role: 'ADMIN',
      },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jest_admin@gifty.com', password: 'test1234' });
    adminToken = loginRes.body.token;

    const createRes = await request(app)
      .post('/api/admin/gift-cards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        merchantName: 'Jest테스트',
        productName: `재고테스트-${Date.now()}`,
        faceValue: 1000,
        validDays: 30,
        totalStock: STOCK,
      });
    giftCard = createRes.body;
  });

  afterAll(async () => {
    // 테스트로 만든 데이터 정리 (개발 DB를 지저분하게 남기지 않기 위함)
    await GiftCardInstance.destroy({ where: { giftCardId: giftCard.id } });
    await Order.destroy({ where: { giftCardId: giftCard.id } });
    await GiftCard.destroy({ where: { id: giftCard.id } });
    await sequelize.close();
  });

  test(`재고 ${STOCK}개에 동시 요청 ${CONCURRENCY}건을 보내면 정확히 ${STOCK}건만 성공한다 (오버셀 없음)`, async () => {
    const tokens = await Promise.all(
      Array.from({ length: CONCURRENCY }, async (_, i) => {
        const email = `jest_user_${i}_${Date.now()}@gifty.com`;
        const res = await request(app).post('/api/auth/register').send({
          email,
          password: 'test1234',
          name: `유저${i}`,
          phone: `010${String(Date.now()).slice(-7)}${i}`,
        });
        return res.body.token;
      })
    );

    // Promise.all로 동시에 발사 - 실제 프로덕션의 트래픽 폭주 상황을 흉내낸다.
    const results = await Promise.all(
      tokens.map((token, i) =>
        request(app)
          .post('/api/gift-cards/purchase')
          .set('Authorization', `Bearer ${token}`)
          .send({
            giftCardId: giftCard.id,
            quantity: 1,
            impUid: `jest_imp_${i}_${Date.now()}`,
            merchantUid: `jest_merchant_${i}`,
          })
      )
    );

    const succeeded = results.filter((r) => r.status === 201);
    const failed = results.filter((r) => r.status !== 201);

    expect(succeeded.length).toBe(STOCK);
    expect(failed.length).toBe(CONCURRENCY - STOCK);
    failed.forEach((r) => {
      expect(r.body.message).toMatch(/재고가 부족합니다/);
    });

    // DB 최종 상태로 정합성까지 재확인 - 재고 수치와 실제 발급된 코드 개수가 일치해야 한다.
    const finalCard = await GiftCard.findByPk(giftCard.id);
    expect(finalCard.remainingStock).toBe(0);

    const instanceCount = await GiftCardInstance.count({ where: { giftCardId: giftCard.id } });
    expect(instanceCount).toBe(STOCK);
  });
});

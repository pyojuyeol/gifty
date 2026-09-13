process.env.PORTONE_V2_API_SECRET = '';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { sequelize, GiftCard, Order, GiftCardInstance, User } = require('../src/models');

describe('결제 멱등성', () => {
  let giftCard;
  let userToken;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync(); // CI처럼 서버를 미리 띄우지 않은 환경에서는 테이블이 없으므로 직접 생성

    const email = `jest_idem_${Date.now()}@gifty.com`;
    await request(app).post('/api/auth/register').send({
      email,
      password: 'test1234',
      name: '멱등성테스트',
      phone: `010${String(Date.now()).slice(-8)}`,
    });
    const loginRes = await request(app).post('/api/auth/login').send({ email, password: 'test1234' });
    userToken = loginRes.body.token;

    await User.findOrCreate({
      where: { email: 'jest_admin@gifty.com' },
      defaults: {
        email: 'jest_admin@gifty.com',
        passwordHash: await bcrypt.hash('test1234', 10),
        name: 'Jest관리자',
        role: 'ADMIN',
      },
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jest_admin@gifty.com', password: 'test1234' });

    const createRes = await request(app)
      .post('/api/admin/gift-cards')
      .set('Authorization', `Bearer ${adminLogin.body.token}`)
      .send({
        merchantName: 'Jest멱등성',
        productName: `상품-${Date.now()}`,
        faceValue: 2000,
        validDays: 30,
      });
    giftCard = createRes.body;
  });

  afterAll(async () => {
    await GiftCardInstance.destroy({ where: { giftCardId: giftCard.id } });
    await Order.destroy({ where: { giftCardId: giftCard.id } });
    await GiftCard.destroy({ where: { id: giftCard.id } });
    await sequelize.close();
  });

  test('같은 impUid로 동시에 두 번 요청해도 주문이 정확히 1건만 생성된다', async () => {
    const impUid = `jest_idem_imp_${Date.now()}`;
    const payload = { giftCardId: giftCard.id, quantity: 1, impUid, merchantUid: 'jest_idem_merchant' };

    // 네트워크 재시도나 이중 클릭처럼 거의 동시에 같은 요청이 두 번 들어오는 상황을 재현
    const [first, second] = await Promise.all([
      request(app).post('/api/gift-cards/purchase').set('Authorization', `Bearer ${userToken}`).send(payload),
      request(app).post('/api/gift-cards/purchase').set('Authorization', `Bearer ${userToken}`).send(payload),
    ]);

    // 둘 중 하나는 성공(201)해야 하고, 나머지 하나는 성공(200, deduped) 또는 충돌(409) 중 하나여야 한다.
    expect([first.status, second.status]).toEqual(expect.arrayContaining([201]));

    const orderCount = await Order.count({ where: { pgTransactionId: impUid } });
    expect(orderCount).toBe(1); // DB 유니크 제약 + 애플리케이션 체크 덕분에 정확히 1건만 존재해야 함
  });

  test('순차적으로 같은 impUid를 재요청하면 기존 주문을 그대로 반환한다 (deduped)', async () => {
    const impUid = `jest_idem_seq_${Date.now()}`;
    const payload = { giftCardId: giftCard.id, quantity: 1, impUid, merchantUid: 'jest_idem_merchant2' };

    const firstRes = await request(app)
      .post('/api/gift-cards/purchase')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);
    expect(firstRes.status).toBe(201);

    const secondRes = await request(app)
      .post('/api/gift-cards/purchase')
      .set('Authorization', `Bearer ${userToken}`)
      .send(payload);
    expect(secondRes.status).toBe(200);
    expect(secondRes.body.deduped).toBe(true);

    const orderCount = await Order.count({ where: { pgTransactionId: impUid } });
    expect(orderCount).toBe(1);
  });
});

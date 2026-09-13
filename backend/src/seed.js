/**
 * 개발용 샘플 데이터 시드 스크립트.
 * 실행: docker-compose exec backend node src/seed.js
 */
require('dotenv').config();
const { sequelize, GiftCard, User } = require('./models');
const bcrypt = require('bcryptjs');

async function seed() {
  await sequelize.authenticate();

  const giftCards = [
    { merchantName: '스타벅스', productName: '아메리카노 Tall', faceValue: 4500, validDays: 90 },
    { merchantName: '스타벅스', productName: '카페라떼 Tall', faceValue: 5000, validDays: 90 },
    { merchantName: 'GS25', productName: '모바일 상품권 1만원권', faceValue: 10000, validDays: 365 },
    { merchantName: '배스킨라빈스', productName: '파인트 아이스크림', faceValue: 12000, validDays: 30 },
    { merchantName: '올리브영', productName: '모바일 상품권 3만원권', faceValue: 30000, validDays: 365 },
  ];

  for (const card of giftCards) {
    await GiftCard.findOrCreate({
      where: { merchantName: card.merchantName, productName: card.productName },
      defaults: card,
    });
  }
  console.log(`상품권 ${giftCards.length}건 시드 완료`);

  // 테스트용 관리자 계정 (이메일: admin@gifty.com / 비밀번호: admin1234)
  const passwordHash = await bcrypt.hash('admin1234', 10);
  await User.findOrCreate({
    where: { email: 'admin@gifty.com' },
    defaults: { email: 'admin@gifty.com', passwordHash, name: '관리자', role: 'ADMIN' },
  });
  console.log('관리자 계정 시드 완료 (admin@gifty.com / admin1234)');

  process.exit(0);
}

seed().catch((err) => {
  console.error('시드 실패:', err);
  process.exit(1);
});

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const { runDailySettlement } = require('../services/settlement.service');
const { GiftCard, Order, Transaction } = require('../models');
const giftcardController = require('../controllers/giftcard.controller');

router.use(authenticate, requireRole('ADMIN'));

// 대시보드용 요약 통계 (발행/판매/사용 현황)
router.get('/dashboard', async (req, res) => {
  const [giftCardCount, orderCount, transactionCount] = await Promise.all([
    GiftCard.count(),
    Order.count({ where: { paymentStatus: 'PAID' } }),
    Transaction.count(),
  ]);
  res.json({ giftCardCount, orderCount, transactionCount });
});

// 정산 배치를 수동으로 트리거 (실제로는 node-cron 스케줄러가 매일 자동 실행)
router.post('/settlements/run', async (req, res) => {
  const { periodStart, periodEnd } = req.body;
  const settlements = await runDailySettlement(periodStart, periodEnd);
  res.json({ message: '정산이 완료되었습니다.', settlements });
});

// 상품권 관리 (등록/수정/판매중지)
router.get('/gift-cards', giftcardController.adminListGiftCards);
router.post('/gift-cards', giftcardController.createGiftCard);
router.put('/gift-cards/:id', giftcardController.updateGiftCard);
router.patch('/gift-cards/:id/toggle', giftcardController.toggleGiftCardActive);

module.exports = router;

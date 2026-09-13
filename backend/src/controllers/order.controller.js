const { sequelize, GiftCardInstance, Transaction, GiftCard, Gift, User } = require('../models');
const { AppError } = require('../middlewares/error.middleware');

// 내가 보유한(구매/선물받은) 상품권 목록 - 상품명까지 함께 내려준다
async function myGiftCards(req, res) {
  const instances = await GiftCardInstance.findAll({
    where: { ownerId: req.user.id, status: ['SOLD', 'GIFTED'] },
    include: [{ model: GiftCard }],
    order: [['expiresAt', 'ASC']],
  });
  res.json(instances);
}

/**
 * 상품권 사용(소진) 처리 - 가맹점 단말 또는 오프라인 사용 시뮬레이션.
 *
 * 핵심: 같은 코드가 동시에 두 번 사용 요청되는 "이중 사용(double spending)"을
 * 막기 위해 SELECT ... FOR UPDATE로 row lock을 건 뒤 상태를 확인/변경한다.
 */
async function useGiftCard(req, res) {
  const { code } = req.body;

  const result = await sequelize.transaction(async (t) => {
    const instance = await GiftCardInstance.findOne({
      where: { code },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!instance) throw new AppError('유효하지 않은 상품권 코드입니다.', 404);
    if (instance.status === 'USED') {
      throw new AppError('이미 사용된 상품권입니다.', 409);
    }
    if (instance.status === 'EXPIRED' || instance.expiresAt < new Date()) {
      await instance.update({ status: 'EXPIRED' }, { transaction: t });
      throw new AppError('유효기간이 만료된 상품권입니다.', 410);
    }

    await instance.update({ status: 'USED' }, { transaction: t });

    const giftCard = await instance.getGiftCard({ transaction: t });

    const transaction = await Transaction.create({
      giftCardInstanceId: instance.id,
      usedBy: instance.ownerId,
      merchantName: giftCard.merchantName,
      amount: giftCard.faceValue,
    }, { transaction: t });

    return transaction;
  });

  res.json({ message: '상품권이 사용 처리되었습니다.', transaction: result });
}

/**
 * 내가 사용(소진)한 상품권 내역 조회.
 * 해당 상품권이 "선물로 받은 것"이었다면, 누구에게 받았는지(Gift -> sender)까지
 * 함께 내려줘서 사용 내역과 선물 출처를 매핑해서 볼 수 있게 한다.
 */
async function myTransactions(req, res) {
  const transactions = await Transaction.findAll({
    where: { usedBy: req.user.id },
    include: [
      {
        model: GiftCardInstance,
        include: [
          { model: GiftCard },
          {
            model: Gift,
            where: { receiverId: req.user.id },
            required: false, // 선물받은 게 아니라 직접 구매한 상품권일 수도 있으므로 LEFT JOIN
            include: [{ model: User, as: 'sender', attributes: ['id', 'name'] }],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.json(transactions);
}

module.exports = { myGiftCards, useGiftCard, myTransactions };

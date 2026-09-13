const { sequelize, GiftCardInstance, Gift, User, GiftCard, Transaction } = require('../models');
const { AppError } = require('../middlewares/error.middleware');

function normalizePhone(phone) {
  return phone ? phone.replace(/[^0-9]/g, '') : phone;
}

// 내가 보유한 상품권을 다른 사람에게 선물
async function sendGift(req, res) {
  const { giftCardInstanceId, message } = req.body;
  const receiverPhone = normalizePhone(req.body.receiverPhone);
  const senderId = req.user.id;

  await sequelize.transaction(async (t) => {
    const instance = await GiftCardInstance.findOne({
      where: { id: giftCardInstanceId, ownerId: senderId },
      transaction: t,
      lock: t.LOCK.UPDATE, // 동시에 같은 상품권을 두 번 선물하는 것을 방지
    });

    if (!instance) throw new AppError('본인 소유의 상품권을 찾을 수 없습니다.', 404);
    if (instance.status !== 'SOLD') {
      throw new AppError('이미 선물했거나 사용된 상품권입니다.', 409);
    }

    const receiver = await User.findOne({ where: { phone: receiverPhone } });

    await Gift.create({
      giftCardInstanceId,
      senderId,
      receiverPhone,
      receiverId: receiver ? receiver.id : null,
      message,
      status: receiver ? 'ACCEPTED' : 'SENT', // 가입된 유저면 즉시 수락 처리(단순화)
    }, { transaction: t });

    // 받는 사람이 이미 가입돼 있으면 소유권이 즉시 이전되므로 바로 사용 가능(SOLD)한 상태로 전환.
    // 미가입 상태라면 아직 아무도 소유하지 않은 채 대기(GIFTED)한다.
    await instance.update({
      status: receiver ? 'SOLD' : 'GIFTED',
      ownerId: receiver ? receiver.id : null,
    }, { transaction: t });
  });

  res.status(201).json({ message: '선물이 전송되었습니다.' });
}

/**
 * 내 선물함(받은 선물) 조회.
 * 상품명, 보낸 사람 이름, 그리고 해당 상품권이 이미 사용됐다면
 * 사용 시각/금액(Transaction)까지 함께 내려줘서 한눈에 상태를 파악할 수 있게 한다.
 */
async function myReceivedGifts(req, res) {
  const gifts = await Gift.findAll({
    where: { receiverId: req.user.id },
    include: [
      {
        model: GiftCardInstance,
        include: [
          { model: GiftCard },
          { model: Transaction }, // 사용 완료된 경우에만 값이 채워짐 (1:1 관계)
        ],
      },
      { model: User, as: 'sender', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.json(gifts);
}

// 내가 보낸 선물 내역 조회
async function mySentGifts(req, res) {
  const gifts = await Gift.findAll({
    where: { senderId: req.user.id },
    include: [{ model: GiftCardInstance, include: [{ model: GiftCard }] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(gifts);
}

module.exports = { sendGift, myReceivedGifts, mySentGifts };

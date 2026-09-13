const { v4: uuidv4 } = require('uuid');
const { sequelize, GiftCard, GiftCardInstance, Order } = require('../models');
const { AppError } = require('../middlewares/error.middleware');
const paymentService = require('../services/payment.service');
const logger = require('../utils/logger');

// 상품권 상품 목록 조회 (구매 화면용 - 판매 중인 것만)
async function listGiftCards(req, res) {
  const cards = await GiftCard.findAll({ where: { isActive: true } });
  res.json(cards);
}

/**
 * 상품권 구매 처리.
 *
 * 동시성/정합성 설계 포인트:
 *
 * 1) 멱등성(idempotency): 같은 impUid로 두 번 요청이 들어와도(네트워크 재시도,
 *    사용자 이중 클릭, 추후 추가될 웹훅과 클라이언트 콜백이 동시에 도는 경우 등)
 *    새 주문을 만들지 않고 기존 주문을 그대로 반환한다. Order.pgTransactionId에
 *    걸어둔 UNIQUE 제약이 최후 방어선이고, 애플리케이션 레벨에서도 선제적으로 체크한다.
 *
 * 2) 재고 동시성: 한정 수량 상품권(totalStock이 설정된 경우)은 SELECT ... FOR UPDATE로
 *    GiftCard 행을 잠근 뒤 재고를 확인하고 차감한다. 트랜잭션이 끝날 때까지 다른
 *    요청은 이 행에 대한 락이 풀리길 기다리므로, 동시에 N명이 몰려도 재고보다
 *    많이 팔리는 오버셀(oversell)이 발생하지 않는다.
 *
 * 3) 위 2가지를 하나의 DB 트랜잭션 안에서 처리해서, "재고는 차감됐는데 주문은
 *    실패했다" 같은 부분 실패(partial failure)가 나지 않도록 원자성을 보장한다.
 */
async function purchaseGiftCard(req, res) {
  const { giftCardId, quantity = 1, impUid, merchantUid } = req.body;
  const buyerId = req.user.id;

  if (!impUid) throw new AppError('결제 고유번호(impUid)가 필요합니다.', 400);

  // 트랜잭션 밖에서 선제적으로 체크 - 이미 처리된 결제면 락을 잡을 필요도 없이 바로 반환
  const existingOrder = await Order.findOne({ where: { pgTransactionId: impUid } });
  if (existingOrder) {
    logger.info(`[purchase] 중복 요청 감지, 기존 주문 반환: impUid=${impUid}`);
    const reissued = await GiftCardInstance.findAll({
      where: { giftCardId: existingOrder.giftCardId, ownerId: buyerId },
      order: [['createdAt', 'DESC']],
      limit: existingOrder.quantity,
    });
    return res.status(200).json({ order: existingOrder, instances: reissued, deduped: true });
  }

  const result = await sequelize.transaction(async (t) => {
    // 재고 확인/차감을 위해 GiftCard 행에 배타적 락을 건다.
    const giftCard = await GiftCard.findByPk(giftCardId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!giftCard || !giftCard.isActive) {
      throw new AppError('존재하지 않거나 판매 중지된 상품권입니다.', 404);
    }

    if (giftCard.totalStock !== null) {
      if (giftCard.remainingStock < quantity) {
        throw new AppError(
          `재고가 부족합니다. (남은 수량: ${giftCard.remainingStock}개)`,
          409
        );
      }
      await giftCard.decrement('remainingStock', { by: quantity, transaction: t });
    }

    const totalAmount = giftCard.faceValue * quantity;

    const verified = await paymentService.verifyPayment({
      impUid,
      merchantUid,
      amount: totalAmount,
    });
    if (!verified.success) {
      throw new AppError('결제 검증에 실패했습니다.', 402);
    }

    let order;
    try {
      order = await Order.create({
        buyerId,
        giftCardId,
        quantity,
        totalAmount,
        paymentStatus: 'PAID',
        pgTransactionId: verified.pgTransactionId,
      }, { transaction: t });
    } catch (err) {
      // 트랜잭션 시작 직전 체크와 실제 INSERT 사이의 찰나의 순간에 동일한 impUid로
      // 요청이 하나 더 들어왔다면(레이스 컨디션) UNIQUE 제약이 여기서 막아준다.
      if (err.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('이미 처리된 결제입니다.', 409);
      }
      throw err;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + giftCard.validDays);

    const instances = await Promise.all(
      Array.from({ length: quantity }).map(() =>
        GiftCardInstance.create({
          giftCardId,
          code: uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase(),
          ownerId: buyerId,
          status: 'SOLD',
          expiresAt,
        }, { transaction: t })
      )
    );

    return { order, instances };
  });

  res.status(201).json(result);
}

// ---- 아래부터는 관리자 전용 (admin.routes.js에서 authenticate + requireRole('ADMIN')로 보호) ----

// 관리자용 상품권 전체 목록 (판매중지 포함)
async function adminListGiftCards(req, res) {
  const cards = await GiftCard.findAll({ order: [['createdAt', 'DESC']] });
  res.json(cards);
}

function validateGiftCardInput({ merchantName, productName, faceValue, validDays, totalStock }) {
  if (!merchantName || !productName) {
    throw new AppError('가맹점명과 상품명은 필수입니다.', 400);
  }
  if (!Number.isInteger(faceValue) || faceValue <= 0) {
    throw new AppError('액면가는 0보다 큰 정수여야 합니다.', 400);
  }
  if (validDays !== undefined && (!Number.isInteger(validDays) || validDays <= 0)) {
    throw new AppError('유효기간(일)은 0보다 큰 정수여야 합니다.', 400);
  }
  if (totalStock !== null && totalStock !== undefined && (!Number.isInteger(totalStock) || totalStock < 0)) {
    throw new AppError('재고 수량은 0 이상의 정수여야 합니다. (무제한이면 비워두세요)', 400);
  }
}

// 상품권 신규 등록
async function createGiftCard(req, res) {
  const { merchantName, productName, imageUrl } = req.body;
  const faceValue = Number(req.body.faceValue);
  const validDays = req.body.validDays !== undefined ? Number(req.body.validDays) : 90;
  const totalStock =
    req.body.totalStock === '' || req.body.totalStock === undefined || req.body.totalStock === null
      ? null
      : Number(req.body.totalStock);

  validateGiftCardInput({ merchantName, productName, faceValue, validDays, totalStock });

  const card = await GiftCard.create({
    merchantName,
    productName,
    faceValue,
    validDays,
    imageUrl,
    totalStock,
    remainingStock: totalStock, // 등록 시점엔 전체 수량이 곧 남은 수량
  });
  res.status(201).json(card);
}

// 상품권 정보 수정. totalStock을 바꾸면 그 변화량(delta)만큼 remainingStock도 함께 조정한다.
async function updateGiftCard(req, res) {
  const { id } = req.params;
  const card = await GiftCard.findByPk(id);
  if (!card) throw new AppError('상품권을 찾을 수 없습니다.', 404);

  const { merchantName, productName, imageUrl } = req.body;
  const faceValue = Number(req.body.faceValue);
  const validDays = Number(req.body.validDays);
  const totalStock =
    req.body.totalStock === '' || req.body.totalStock === undefined || req.body.totalStock === null
      ? null
      : Number(req.body.totalStock);

  validateGiftCardInput({ merchantName, productName, faceValue, validDays, totalStock });

  let remainingStock = card.remainingStock;
  if (totalStock === null) {
    remainingStock = null; // 무제한으로 전환
  } else if (card.totalStock === null) {
    remainingStock = totalStock; // 무제한 -> 한정 수량으로 전환: 남은 수량을 새로 설정
  } else {
    const delta = totalStock - card.totalStock;
    remainingStock = Math.max(0, card.remainingStock + delta); // 증고/감소분만큼 남은 수량도 조정
  }

  await card.update({ merchantName, productName, faceValue, validDays, imageUrl, totalStock, remainingStock });
  res.json(card);
}

// 판매중지/재개 토글. 이미 발급된 GiftCardInstance에는 영향 없음 - 신규 구매만 막는다.
async function toggleGiftCardActive(req, res) {
  const { id } = req.params;
  const card = await GiftCard.findByPk(id);
  if (!card) throw new AppError('상품권을 찾을 수 없습니다.', 404);

  await card.update({ isActive: !card.isActive });
  res.json(card);
}

module.exports = {
  listGiftCards,
  purchaseGiftCard,
  adminListGiftCards,
  createGiftCard,
  updateGiftCard,
  toggleGiftCardActive,
};

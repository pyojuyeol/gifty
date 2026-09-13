const logger = require('../utils/logger');

const PORTONE_API_BASE = 'https://api.portone.io';

// PORTONE_V2_API_SECRET이 설정 안 돼있거나 예시값 그대로면 mock 모드로 동작.
function isMockMode() {
  const secret = process.env.PORTONE_V2_API_SECRET;
  return !secret || secret === 'your_test_v2_api_secret';
}

/**
 * 결제 검증 (포트원 V2).
 *
 * V1과 달리 별도 토큰 발급 단계 없이 API Secret을 커스텀 스킴("PortOne {secret}")으로
 * Authorization 헤더에 바로 실어서 인증한다.
 *
 * impUid 파라미터명은 V1 시절의 흔적이지만, 여기서는 우리가 프론트에서 발급한
 * paymentId를 그대로 받아 조회에 사용한다 (V2는 결제 ID를 가맹점이 채번한다).
 *
 * 1) 결제 상태가 실제로 'PAID'인지, 2) 클라이언트가 요청한 금액과 실결제 금액이
 * 일치하는지(금액 위변조 방지)를 서버 사이드에서 재검증한다.
 */
async function verifyPayment({ impUid: paymentId, merchantUid, amount }) {
  if (isMockMode()) {
    logger.info(`[payment:mock] verify called: paymentId=${paymentId}, merchantUid=${merchantUid}, amount=${amount}`);
    return { success: true, pgTransactionId: paymentId };
  }

  try {
    const res = await fetch(`${PORTONE_API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET}` },
    });
    const payment = await res.json();

    if (!res.ok) {
      logger.error(`[payment] 결제 조회 실패 (status=${res.status}): ${payment.message || JSON.stringify(payment)}`);
      return { success: false };
    }

    if (payment.status !== 'PAID') {
      logger.error(`[payment] 결제 상태 이상 (status=${payment.status}), paymentId=${paymentId}`);
      return { success: false };
    }

    const paidAmount = payment.amount?.total;
    if (amount !== null && amount !== undefined && paidAmount !== amount) {
      logger.error(`[payment] 금액 위변조 의심: 요청 금액=${amount}, 실결제 금액=${paidAmount}`);
      return { success: false };
    }

    return { success: true, pgTransactionId: paymentId };
  } catch (err) {
    logger.error(`[payment] 검증 중 오류: ${err.message}`);
    return { success: false };
  }
}

async function cancelPayment({ pgTransactionId: paymentId, reason }) {
  if (isMockMode()) {
    logger.info(`[payment:mock] cancel called: paymentId=${paymentId}, reason=${reason}`);
    return { success: true };
  }

  const res = await fetch(`${PORTONE_API_BASE}/payments/${encodeURIComponent(paymentId)}/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `PortOne ${process.env.PORTONE_V2_API_SECRET}`,
    },
    body: JSON.stringify({ reason }),
  });
  return { success: res.ok };
}

module.exports = { verifyPayment, cancelPayment, isMockMode };

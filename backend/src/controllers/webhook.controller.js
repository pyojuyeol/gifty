const { Order } = require('../models');
const logger = require('../utils/logger');

/**
 * 포트원 V2 웹훅 수신 엔드포인트.
 *
 * V2 웹훅 페이로드는 V1과 구조가 다르다:
 *   { type: "Transaction.Paid", data: { paymentId, transactionId, storeId } }
 * (V1은 imp_uid/merchant_uid가 최상위 평면 구조였다.)
 *
 * 실제 서비스 흐름: 결제창에서 결제가 완료되면 (1) 클라이언트가 우리 서버의
 * /gift-cards/purchase를 호출해서 즉시 주문을 확정하고, 동시에 (2) 포트원 서버가
 * 이 엔드포인트로 결제 완료를 통지한다. (1)이 사용자의 네트워크 문제나 브라우저
 * 종료로 실패하더라도, (2)의 웹훅이 재시도되며 결국 정합성을 맞춰주는 안전망 역할을 한다.
 *
 * 멱등성: 같은 paymentId로 웹훅이 여러 번 와도 Order.pgTransactionId UNIQUE 제약
 * 덕분에 절대 중복 처리되지 않는다.
 *
 * 실 운영에서는 포트원이 보내는 webhook-signature 헤더 검증이 반드시 필요하다
 * (여기선 학습용으로 생략, TODO로 표시).
 */
async function portoneWebhook(req, res) {
  const paymentId = req.body?.data?.paymentId;
  const eventType = req.body?.type;

  if (!paymentId) {
    logger.error('[webhook] paymentId 누락된 웹훅 요청');
    return res.status(400).json({ message: 'data.paymentId가 필요합니다.' });
  }

  logger.info(`[webhook] 포트원 V2 웹훅 수신: type=${eventType}, paymentId=${paymentId}`);

  const existingOrder = await Order.findOne({ where: { pgTransactionId: paymentId } });
  if (existingOrder) {
    logger.info(`[webhook] 이미 처리된 주문 (멱등 처리): orderId=${existingOrder.id}`);
    return res.status(200).json({ message: '이미 처리된 결제입니다.', duplicated: true });
  }

  // 실제 구현이라면 여기서 포트원 API로 결제 상세를 재조회해서 대응하는 PENDING 주문을
  // 찾아 PAID로 전환 + 상품권 발급까지 처리해야 한다. 이 프로젝트는 구매 API가 이미
  // 그 역할을 동기적으로 하고 있으므로, 여기서는 "아직 반영 안 된 결제 건"을 감지하고
  // 로그를 남기는 안전망 역할까지만 구현한다.
  logger.info(`[webhook] 대응하는 주문을 찾지 못함 - 추후 대사(reconciliation) 배치 대상: paymentId=${paymentId}`);

  res.status(200).json({ message: '웹훅을 수신했습니다.' });
}

module.exports = { portoneWebhook };

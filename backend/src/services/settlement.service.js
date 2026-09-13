const { Op } = require('sequelize');
const { sequelize, Transaction, Settlement } = require('../models');
const logger = require('../utils/logger');

/**
 * 지정된 기간 동안 발생한 미정산(settled=false) 거래를 가맹점별로 묶어
 * Settlement 레코드를 생성하고, 해당 거래들을 정산 완료 처리한다.
 *
 * 실무 포인트:
 * - 트랜잭션으로 묶어 "정산 생성"과 "거래 상태 변경"의 원자성을 보장
 * - 같은 배치가 중복 실행되어도 안전하도록 settled 플래그로 멱등성 확보
 */
async function runDailySettlement(periodStart, periodEnd) {
  return sequelize.transaction(async (t) => {
    const transactions = await Transaction.findAll({
      where: {
        settled: false,
        createdAt: { [Op.between]: [periodStart, periodEnd] },
      },
      transaction: t,
      lock: t.LOCK.UPDATE, // 동시 배치 실행 시 row-level lock으로 중복 정산 방지
    });

    const grouped = transactions.reduce((acc, tx) => {
      acc[tx.merchantName] = acc[tx.merchantName] || [];
      acc[tx.merchantName].push(tx);
      return acc;
    }, {});

    const settlements = [];

    for (const [merchantName, txs] of Object.entries(grouped)) {
      const totalAmount = txs.reduce((sum, tx) => sum + tx.amount, 0);

      const settlement = await Settlement.create({
        merchantName,
        periodStart,
        periodEnd,
        totalAmount,
        transactionCount: txs.length,
        status: 'PENDING',
      }, { transaction: t });

      await Transaction.update(
        { settled: true, settlementId: settlement.id },
        { where: { id: txs.map((tx) => tx.id) }, transaction: t }
      );

      settlements.push(settlement);
    }

    logger.info(`[settlement] ${settlements.length}개 가맹점 정산 생성 (${periodStart} ~ ${periodEnd})`);
    return settlements;
  });
}

module.exports = { runDailySettlement };

require('dotenv').config();
const cron = require('node-cron');

const app = require('./app');
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const { runDailySettlement } = require('./services/settlement.service');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('DB 연결 성공');

    // 개발 편의를 위해 sync 사용. 운영에서는 마이그레이션(sequelize-cli)으로 전환할 것.
    await sequelize.sync();

    app.listen(PORT, () => {
      logger.info(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
    });

    // 매일 자정에 전일 거래 정산 배치 실행
    cron.schedule('0 0 * * *', async () => {
      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 1);
      try {
        await runDailySettlement(periodStart, periodEnd);
      } catch (err) {
        logger.error(`정산 배치 실패: ${err.message}`);
      }
    });
  } catch (err) {
    logger.error(`서버 시작 실패: ${err.message}`);
    process.exit(1);
  }
}

start();

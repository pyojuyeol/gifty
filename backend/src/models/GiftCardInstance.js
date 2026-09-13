const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// 실제로 고객에게 지급되는 개별 상품권 코드.
// 상태 전이: ISSUED -> SOLD -> (GIFTED) -> USED / EXPIRED
// 동시성 이슈(같은 코드 중복 사용)는 status 컬럼에 대한
// 낙관적 잠금(version) 또는 트랜잭션 격리로 방지한다.
const GiftCardInstance = sequelize.define('GiftCardInstance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  giftCardId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // 실제 상품권 바코드/핀번호
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: true, // 현재 소유자 (구매자 또는 선물 수신자)
  },
  status: {
    type: DataTypes.ENUM('ISSUED', 'SOLD', 'GIFTED', 'USED', 'EXPIRED'),
    defaultValue: 'ISSUED',
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // 낙관적 락(optimistic lock)용 버전 컬럼
  },
}, {
  tableName: 'gift_card_instances',
  timestamps: true,
  version: 'version', // Sequelize optimistic locking
});

module.exports = GiftCardInstance;

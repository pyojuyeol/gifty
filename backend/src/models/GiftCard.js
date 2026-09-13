const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// 상품권 "상품" 마스터 정보. 실제 발행 코드는 GiftCardInstance에서 관리한다.
const GiftCard = sequelize.define('GiftCard', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  merchantName: {
    type: DataTypes.STRING,
    allowNull: false, // 예: 스타벅스, GS25
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false, // 예: 아메리카노 Tall
  },
  faceValue: {
    type: DataTypes.INTEGER, // 액면가 (원)
    allowNull: false,
  },
  validDays: {
    type: DataTypes.INTEGER, // 구매일로부터 유효기간(일)
    defaultValue: 90,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // 재고 한도. null이면 무제한(기존 상품권들과의 하위 호환).
  // 숫자가 들어가면 remainingStock을 초과하는 구매는 막아야 한다 - 동시성 제어의 핵심 대상.
  totalStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  remainingStock: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'gift_cards',
  timestamps: true,
});

module.exports = GiftCard;

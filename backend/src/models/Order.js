const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  buyerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  giftCardId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  totalAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  paymentStatus: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'),
    defaultValue: 'PENDING',
  },
  pgTransactionId: {
    type: DataTypes.STRING, // 포트원 등 PG사 거래 ID (imp_uid)
    allowNull: true,
    unique: true, // 같은 결제 건으로 주문이 중복 생성되는 것을 DB 레벨에서 방지 (멱등성)
  },
}, {
  tableName: 'orders',
  timestamps: true,
});

module.exports = Order;

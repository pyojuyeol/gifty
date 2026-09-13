const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// 상품권이 실제로 "사용(소진)"된 기록. 가맹점 정산의 기준 데이터가 된다.
const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  giftCardInstanceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  usedBy: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  merchantName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  settled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // 정산 배치가 이 건을 처리했는지 여부
  },
  settlementId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'transactions',
  timestamps: true,
});

module.exports = Transaction;

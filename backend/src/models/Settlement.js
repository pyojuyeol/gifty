const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// 일/월 단위 배치로 생성되는 가맹점 정산 데이터
const Settlement = sequelize.define('Settlement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  merchantName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  periodStart: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  periodEnd: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  transactionCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'PAID'),
    defaultValue: 'PENDING',
  },
}, {
  tableName: 'settlements',
  timestamps: true,
});

module.exports = Settlement;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Gift = sequelize.define('Gift', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  giftCardInstanceId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  receiverPhone: {
    type: DataTypes.STRING,
    allowNull: false, // 수신자가 미가입 회원일 수 있으므로 전화번호로 발송
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: true, // 수신자가 수락(가입/로그인) 후 채워짐
  },
  message: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('SENT', 'ACCEPTED', 'EXPIRED'),
    defaultValue: 'SENT',
  },
}, {
  tableName: 'gifts',
  timestamps: true,
});

module.exports = Gift;

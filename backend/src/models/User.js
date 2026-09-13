const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: true, // 소셜 로그인 사용자는 null 가능
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true, // 같은 번호로 중복 가입 방지
  },
  role: {
    type: DataTypes.ENUM('USER', 'ADMIN', 'MERCHANT'),
    defaultValue: 'USER',
  },
  kakaoId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;

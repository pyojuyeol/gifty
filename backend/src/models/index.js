const sequelize = require('../config/db');
const User = require('./User');
const GiftCard = require('./GiftCard');
const GiftCardInstance = require('./GiftCardInstance');
const Order = require('./Order');
const Gift = require('./Gift');
const Transaction = require('./Transaction');
const Settlement = require('./Settlement');

// --- 관계 정의 ---

// GiftCard 1 : N GiftCardInstance
GiftCard.hasMany(GiftCardInstance, { foreignKey: 'giftCardId' });
GiftCardInstance.belongsTo(GiftCard, { foreignKey: 'giftCardId' });

// User 1 : N Order (구매자)
User.hasMany(Order, { foreignKey: 'buyerId' });
Order.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });

// GiftCard 1 : N Order
GiftCard.hasMany(Order, { foreignKey: 'giftCardId' });
Order.belongsTo(GiftCard, { foreignKey: 'giftCardId' });

// GiftCardInstance 1 : N Gift (하나의 코드가 여러 번 재선물될 수도 있다고 가정)
GiftCardInstance.hasMany(Gift, { foreignKey: 'giftCardInstanceId' });
Gift.belongsTo(GiftCardInstance, { foreignKey: 'giftCardInstanceId' });

User.hasMany(Gift, { foreignKey: 'senderId', as: 'sentGifts' });
Gift.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// GiftCardInstance 1 : 1 Transaction (사용은 1회로 제한)
GiftCardInstance.hasOne(Transaction, { foreignKey: 'giftCardInstanceId' });
Transaction.belongsTo(GiftCardInstance, { foreignKey: 'giftCardInstanceId' });

// Settlement 1 : N Transaction
Settlement.hasMany(Transaction, { foreignKey: 'settlementId' });
Transaction.belongsTo(Settlement, { foreignKey: 'settlementId' });

module.exports = {
  sequelize,
  User,
  GiftCard,
  GiftCardInstance,
  Order,
  Gift,
  Transaction,
  Settlement,
};

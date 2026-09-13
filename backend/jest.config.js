module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000, // 동시 요청/다수 회원가입이 포함된 테스트가 있어 넉넉히 설정
  forceExit: true, // DB 커넥션 풀이 열려있어도 테스트 종료 후 강제 종료
};

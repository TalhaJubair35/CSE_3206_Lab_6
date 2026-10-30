module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/services/**/*.js',
    'src/exporters/**/*.js',
    'src/controllers/**/*.js'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70
    }
  }
};

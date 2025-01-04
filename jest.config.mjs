export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['<rootDir>/test/fixtures'],
    coveragePathIgnorePatterns: ['<rootDir>/test/'],
    testRegex: 'test/(.+)\\.test\\.(jsx?|tsx?)$',
    setupFilesAfterEnv: ['./jest.setup.js'],
    verbose: true,
    // testMatch: ['**/*.test.ts'], // 匹配测试文件
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '^.+\\.ts$': 'ts-jest', // 使用 ts-jest 处理 .ts 文件
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    }
};

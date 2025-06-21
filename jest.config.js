module.exports = {
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/$1", // If you're using `@` aliases
    },
    testPathIgnorePatterns: ["/node_modules/", "/.next/"],
    transform: {
      "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    },
    moduleDirectories: ["node_modules", "src"],
  };
  
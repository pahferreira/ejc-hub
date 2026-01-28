export default {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts", "**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
};

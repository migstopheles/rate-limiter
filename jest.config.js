module.exports = {
	testURL: "http://localhost/",
	clearMocks: true,
	testPathIgnorePatterns: [
		"<rootDir>/node_modules/",
		"<rootDir>/build/",
	],
	transform: {
		"^.+\\.ts$": "ts-jest"
	},
	testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(js|ts)$",
	moduleFileExtensions: [
		"ts",
		"js",
		"json"
	]
}

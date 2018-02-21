const pkg = require("./package.json");


export default {
	input: "src/tests.ts",
	output: {
		file: "build/tests.js",
		format: "cjs",
	},
	external: [
		"testsome",
	],
	plugins: [
		require("rollup-plugin-tsc")({
			compilerOptions: {
				noUnusedLocals: true,
			},
		}),
	],
};

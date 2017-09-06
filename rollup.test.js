const pkg = require("./package.json");


export default {
	input: "src/test.ts",
	output: {file: "build/test.js", format: "cjs"},
	external: [
		"process",
	],
	sourcemap: true,
	plugins: [
		require("rollup-plugin-tsc")({
			compilerOptions: {
				noUnusedLocals: true,
			},
		}),
	],
};

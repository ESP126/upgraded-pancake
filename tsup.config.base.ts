import { defineConfig, type Options } from 'tsup';

export const baseBuildConfig: Options = {
	entry: ['src/index.ts'],
	format: ['esm'],
	dts: true,
	sourcemap: true,
	clean: true,
	minify: false,
	target: 'es2022',
	splitting: false,
	treeshake: true,
	outDir: 'dist',
};

export default defineConfig(baseBuildConfig);

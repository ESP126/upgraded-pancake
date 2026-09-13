import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
	{
		ignores: ['**/dist/*', '**/node_modules/**', '**/*.tsbuildinfo', '**/coverage/**'],
	},
	...tseslint.configs.strict,
	...tseslint.configs.stylistic,
	prettierConfig,
	{
		rules: {
			'@typescript-eslint/explicit-function-return-type': 'error',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'@typescript-eslint/consistent-type-imports': [
				'error',
				{ prefer: 'type-imports', fixStyle: 'separate-type-imports' },
			],
		},
	},
);

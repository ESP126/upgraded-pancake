import { defineConfig } from 'tsup';
import { baseBuildConfig } from '../../tsup.config.base.ts';

export default defineConfig({
  ...baseBuildConfig,
  entry: ['src/index.ts'],
});

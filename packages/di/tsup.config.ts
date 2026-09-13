import { defineConfig } from 'tsup';
import { baseBuildConfig } from '../../tsup.config.base.js';

export default defineConfig({
  ...baseBuildConfig,
  entry: ['src/index.ts'],
});

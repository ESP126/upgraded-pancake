import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MetadataStorage } from '../metadata/metadata-storage.js';
import { METADATA_KEYS } from '../metadata/metadata-keys.js';

describe('MetadataStorage', () => {
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class TestService {}

  it('should define and retrieve class-level metadata', () => {
    MetadataStorage.defineMetadata(METADATA_KEYS.INJECTABLE, true, TestService);

    const isInjectable = MetadataStorage.getMetadata<boolean>(
      METADATA_KEYS.INJECTABLE,
      TestService,
    );
    assert.equal(isInjectable, true);
    assert.equal(MetadataStorage.hasMetadata(METADATA_KEYS.INJECTABLE, TestService), true);
  });

  it('should define and retrieve property-level metadata', () => {
    MetadataStorage.defineMetadata(
      'custom:role',
      'admin',
      TestService.prototype as object,
      'execute',
    );

    const role = MetadataStorage.getMetadata<string>(
      'custom:role',
      TestService.prototype as object,
      'execute',
    );
    assert.equal(role, 'admin');
  });

  it('should correctly store and append parameter injection metadata', () => {
    MetadataStorage.addParamMetadata(
      METADATA_KEYS.PARAM_INJECTIONS,
      0,
      'LOGGER_TOKEN',
      TestService,
    );
    MetadataStorage.addParamMetadata(
      METADATA_KEYS.PARAM_INJECTIONS,
      1,
      'CONFIG_TOKEN',
      TestService,
    );

    const params = MetadataStorage.getMetadata<{ index: number; token: string }[]>(
      METADATA_KEYS.PARAM_INJECTIONS,
      TestService,
    );

    assert.ok(Array.isArray(params));
    assert.equal(params.length, 2);
    assert.deepEqual(params[0], { index: 0, token: 'LOGGER_TOKEN' });
    assert.deepEqual(params[1], { index: 1, token: 'CONFIG_TOKEN' });
  });

  it('should return undefined for non-existent metadata keys', () => {
    const value = MetadataStorage.getMetadata('non:existent', TestService);
    assert.equal(value, undefined);
    assert.equal(MetadataStorage.hasMetadata('non:existent', TestService), false);
  });
});

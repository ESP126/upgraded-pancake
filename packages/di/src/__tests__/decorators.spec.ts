import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Injectable } from '../decorators/injectable.decorator.js';
import { Inject } from '../decorators/inject.decorator.js';
import { MetadataStorage } from '../metadata/metadata-storage.js';
import { METADATA_KEYS } from '../metadata/metadata-keys.js';
import type { InjectableOptions } from '../types/injectable-options.js';
import type { InjectionToken } from '../types/injection-token.js';

describe('DI Decorator (@Injectable & @Inject)', () => {
  it('should attack @Injectable metadata with custom scope to target class', () => {
    @Injectable({ scope: 'transient' })
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    class UserService {}

    const config = MetadataStorage.getMetadata<InjectableOptions>(
      METADATA_KEYS.INJECTABLE,
      UserService,
    );

    assert.ok(config);
    assert.equal(config.scope, 'transient');
  });

  it('should default scope to singleton when @Injectable options are omitted', () => {
    @Injectable()
    // eslint-disable-next-line @typescript-eslint/no-extraneous-class
    class LoggerService {}

    const config = MetadataStorage.getMetadata<InjectableOptions>(
      METADATA_KEYS.INJECTABLE,
      LoggerService,
    );

    assert.ok(config);
    assert.equal(config.scope, 'singleton');
  });

  it('should store constructor parameter injection tokens via @Inject', () => {
    const DB_TOKEN = Symbol('DB_TOKEN');

    @Injectable()
    class OrderService {
      constructor(
        @Inject(DB_TOKEN) public db: unknown,
        @Inject('CONFIG') public config: unknown,
      ) {}
    }

    const params = MetadataStorage.getMetadata<{ index: number; token: InjectionToken }[]>(
      METADATA_KEYS.PARAM_INJECTIONS,
      OrderService,
    );

    assert.ok(Array.isArray(params));
    assert.equal(params.length, 2);
    assert.equal(params.find((p) => p.index === 0)?.token, DB_TOKEN);
    assert.equal(params.find((p) => p.index === 1)?.token, 'CONFIG');
  });

  it('should store property injection tokens via @Inject', () => {
    class ApiService {
      @Inject('HTTP_CLIENT')
      public httpClient!: unknown;
    }

    const props = MetadataStorage.getMetadata<
      { propertyKey: string | symbol; token: InjectionToken }[]
    >(METADATA_KEYS.PROPERTY_INJECTIONS, ApiService.prototype as object);

    assert.ok(Array.isArray(props));
    assert.equal(props.length, 1);
    assert.equal(props[0]?.propertyKey, 'httpClient');
    assert.equal(props[0]?.token, 'HTTP_CLIENT');
  });
});

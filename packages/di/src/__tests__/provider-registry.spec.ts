/* eslint-disable @typescript-eslint/no-extraneous-class */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProviderRegistry } from '../providers/provider-registry.js';
import {
  isClassProvider,
  isValueProvider,
  isFactoryProvider,
  isExistingProvider,
} from '../providers/provider.interface.js';

describe('ProviderRegistry & Provider Types', () => {
  class ServiceA {}
  class ServiceB {}

  it('should register and normalize a shorthand class provider', () => {
    const registry = new ProviderRegistry();
    const token = registry.register(ServiceA);

    assert.equal(token, ServiceA);
    assert.equal(registry.has(ServiceA), true);
    assert.equal(registry.getProviderType(ServiceA), 'class');

    const provider = registry.get(ServiceA);
    assert.ok(provider && isClassProvider(provider));
    assert.equal(provider.useClass, ServiceA);
  });

  it('should register a ValueProvider correctly', () => {
    const registry = new ProviderRegistry();
    const CONFIG_TOKEN = Symbol('CONFIG');

    registry.register({
      provide: CONFIG_TOKEN,
      useValue: { port: 3000 },
    });

    assert.equal(registry.getProviderType(CONFIG_TOKEN), 'value');
    const provider = registry.get(CONFIG_TOKEN);
    assert.ok(provider && isValueProvider(provider));
    assert.deepEqual(provider.useValue, { port: 3000 });
  });

  it('should register a FactoryProvider correctly', () => {
    const registry = new ProviderRegistry();
    const FACTORY_TOKEN = 'CLIENT_FACTORY';

    registry.register({
      provide: FACTORY_TOKEN,
      useFactory: () => 'created-instance',
      inject: [ServiceA],
    });

    assert.equal(registry.getProviderType(FACTORY_TOKEN), 'factory');
    const provider = registry.get(FACTORY_TOKEN);
    assert.ok(provider && isFactoryProvider(provider));
    assert.equal(provider.inject?.[0], ServiceA);
  });

  it('should register an ExistingProvider (alias) correctly', () => {
    const registry = new ProviderRegistry();
    const ALIAS_TOKEN = 'ALIAS_SERVICE';

    registry.register({
      provide: ALIAS_TOKEN,
      useExisting: ServiceB,
    });

    assert.equal(registry.getProviderType(ALIAS_TOKEN), 'existing');
    const provider = registry.get(ALIAS_TOKEN);
    assert.ok(provider && isExistingProvider(provider));
    assert.equal(provider.useExisting, ServiceB);
  });
});

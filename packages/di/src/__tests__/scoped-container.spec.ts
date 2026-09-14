import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Container } from '../container/container.js';
import { Injectable } from '../decorators/injectable.decorator.js';

describe('Transient and Requset Scope Resolution', () => {
  @Injectable({ scope: 'transient' })
  class TransientService {
    public readonly id = Math.random();
  }

  @Injectable({ scope: 'request' })
  class RequestScopedService {
    public readonly id = Math.random();
  }

  @Injectable({ scope: 'singleton' })
  class SingletonService {
    public readonly id = Math.random();
  }

  it('should instantiare a new instance on every resolve for transient scope', () => {
    const container = new Container();
    container.register(TransientService);

    const t1 = container.resolve<TransientService>(TransientService);
    const t2 = container.resolve<TransientService>(TransientService);

    assert.notEqual(t1, t2);
    assert.notEqual(t1.id, t2.id);
  });

  it('should reuse instance within the same request scope, but differentiate across scopes', () => {
    const container = new Container();
    container.register(RequestScopedService);

    const scopeA = container.createScope();
    const scopeB = container.createScope();

    const reqA1 = scopeA.resolve<RequestScopedService>(RequestScopedService);
    const reqA2 = scopeA.resolve<RequestScopedService>(RequestScopedService);

    const reqB1 = scopeB.resolve<RequestScopedService>(RequestScopedService);

    // Same scope -> same instance
    assert.equal(reqA1, reqA2);
    assert.equal(reqA1.id, reqA2.id);

    // Different scope -> different instance
    assert.notEqual(reqA1, reqB1);
    assert.notEqual(reqA1.id, reqB1.id);
  });

  it('should correctly inherit singleton instance inside a ScopedContainer', () => {
    const container = new Container();
    container.register(SingletonService);

    const scopeA = container.createScope();
    const scopeB = container.createScope();

    const s1 = container.resolve<SingletonService>(SingletonService);
    const sA = scopeA.resolve<SingletonService>(SingletonService);
    const sB = scopeB.resolve<SingletonService>(SingletonService);

    assert.equal(s1, sA);
    assert.equal(sA, sB);
  });
});

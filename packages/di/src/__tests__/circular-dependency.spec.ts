import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProviderRegistry } from '../providers/provider-registry.js';
import { DependencyGraph } from '../graph/dependency-graph.js';
import { Injectable } from '../decorators/injectable.decorator.js';
import { Inject } from '../decorators/inject.decorator.js';
import { CircularDependencyError } from '../errors/circular-dependency.error.js';

describe('CircularDependencyDetector', () => {
  it('should detect a direct circular dependency (A -> B -> A)', () => {
    const TOKEN_A = 'SERVICE_A';
    const TOKEN_B = 'SERVICE_B';

    @Injectable()
    class ServiceA {
      constructor(@Inject(TOKEN_B) public b: unknown) {}
    }

    @Injectable()
    class ServiceB {
      constructor(@Inject(TOKEN_A) public a: unknown) {}
    }

    const registry = new ProviderRegistry();
    registry.register({ provide: TOKEN_A, useClass: ServiceA });
    registry.register({ provide: TOKEN_B, useClass: ServiceB });

    const graph = new DependencyGraph();

    assert.throws(
      () => {
        graph.build(registry);
      },
      (err: unknown) => {
        assert.ok(err instanceof CircularDependencyError);
        assert.ok(err.message.includes('SERVICE_A -> SERVICE_B -> SERVICE_A'));
        assert.deepEqual(err.path, [TOKEN_A, TOKEN_B, TOKEN_A]);
        return true;
      },
    );
  });

  it('should detect an indirect circular dependency (A -> B -> C -> A)', () => {
    const TOKEN_A = 'TOKEN_A';
    const TOKEN_B = 'TOKEN_B';
    const TOKEN_C = 'TOKEN_C';

    const registry = new ProviderRegistry();
    registry.register({ provide: TOKEN_A, useFactory: () => ({}), inject: [TOKEN_B] });
    registry.register({ provide: TOKEN_B, useFactory: () => ({}), inject: [TOKEN_C] });
    registry.register({ provide: TOKEN_C, useFactory: () => ({}), inject: [TOKEN_A] });

    const graph = new DependencyGraph();

    assert.throws(
      () => {
        graph.build(registry);
      },
      (err: unknown) => {
        assert.ok(err instanceof CircularDependencyError);
        assert.ok(err.message.includes('TOKEN_A -> TOKEN_B -> TOKEN_C -> TOKEN_A'));
        return true;
      },
    );
  });

  it('should allow valid non-circular complex graphs (DAG)', () => {
    const TOKEN_A = 'TOKEN_A';
    const TOKEN_B = 'TOKEN_B';
    const TOKEN_C = 'TOKEN_C';

    const registry = new ProviderRegistry();
    registry.register({ provide: TOKEN_A, useValue: 'base' });
    registry.register({ provide: TOKEN_B, useFactory: () => ({}), inject: [TOKEN_A] });
    registry.register({ provide: TOKEN_C, useFactory: () => ({}), inject: [TOKEN_A, TOKEN_B] });

    const graph = new DependencyGraph();
    assert.doesNotThrow(() => {
      graph.build(registry);
    });
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProviderRegistry, DependencyGraph, Injectable, Inject } from '../index.js';

describe('DependencyGraph & Directed Graph Constrution', () => {
  const DB_TOKEN = Symbol('DB_TOKEN');

  @Injectable()
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class DatabaseService {}

  @Injectable()
  class UserRepository {
    constructor(@Inject(DB_TOKEN) public db: DatabaseService) {}
  }

  @Injectable()
  class UserService {
    constructor(@Inject(UserRepository) public repo: UserRepository) {}
  }

  it('should accurately resolve dependencies and build directed edges', () => {
    const registry = new ProviderRegistry();
    registry.register({ provide: DB_TOKEN, useClass: DatabaseService });
    registry.register(UserRepository);
    registry.register(UserService);

    const graph = new DependencyGraph();
    graph.build(registry);

    const userRepoNode = graph.getNode(UserRepository);
    assert.ok(userRepoNode);
    assert.equal(userRepoNode.dependencies.has(DB_TOKEN), true);

    const userServiceNode = graph.getNode(UserService);
    assert.ok(userServiceNode);
    assert.equal(userServiceNode.dependencies.has(UserRepository), true);
  });

  it('should generate a valid topological order where dependencies precede consumers', () => {
    const registry = new ProviderRegistry();
    registry.register(UserService);
    registry.register({ provide: DB_TOKEN, useClass: DatabaseService });
    registry.register(UserRepository);

    const graph = new DependencyGraph();
    graph.build(registry);

    const order = graph.getTopologicalOrder();

    const dbIndex = order.indexOf(DB_TOKEN);
    const repoIndex = order.indexOf(UserRepository);
    const serviceIndex = order.indexOf(UserService);
    assert.ok(dbIndex < repoIndex, 'DB_TOKEN must come before UserRepository');
    assert.ok(repoIndex < serviceIndex, 'UserRepository must come before UserService');
  });

  it('should process factory providers with injected dependencies', () => {
    const registry = new ProviderRegistry();
    const API_KEY = 'API_KEY';
    const CLIENT_TOKEN = 'HTTP_CLIENT';

    registry.register({ provide: API_KEY, useValue: 'secret-123' });
    registry.register({
      provide: CLIENT_TOKEN,
      useFactory: (key: string) => ({ key }),
      inject: [API_KEY],
    });

    const graph = new DependencyGraph();
    graph.build(registry);

    const clientNode = graph.getNode(CLIENT_TOKEN);
    assert.ok(clientNode);
    assert.equal(clientNode.dependencies.has(API_KEY), true);

    const order = graph.getTopologicalOrder();
    assert.ok(order.indexOf(API_KEY) < order.indexOf(CLIENT_TOKEN));
  });
});

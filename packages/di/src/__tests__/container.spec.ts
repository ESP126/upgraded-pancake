import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Container, Injectable, Inject, ContainerError } from '../index.js';

describe('Container & Singleton Scope Resolution', () => {
  const DB_TOKEN = Symbol('DB_TOKEN');

  @Injectable()
  class DatabaseService {
    public readonly id = Math.random();
  }

  @Injectable()
  class UserRepository {
    constructor(@Inject(DB_TOKEN) public db: DatabaseService) {}
  }

  @Injectable()
  class UserService {
    @Inject('CONFIG')
    public config!: { appName: string };

    constructor(@Inject(UserRepository) public repo: UserRepository) {}
  }

  it('should resolve singleton instances and reuse the same instance in memory', () => {
    const container = new Container();
    container.register({ provide: DB_TOKEN, useClass: DatabaseService });

    const db1 = container.resolve<DatabaseService>(DB_TOKEN);
    const db2 = container.resolve<DatabaseService>(DB_TOKEN);

    assert.equal(db1, db2);
    assert.equal(db1.id, db2.id);
  });

  it('should recursively resolve constructor and property injected dependencies', () => {
    const container = new Container();
    container.register({ provide: DB_TOKEN, useClass: DatabaseService });
    container.register({ provide: 'CONFIG', useValue: { appName: 'TestFramework' } });
    container.register(UserRepository);
    container.register(UserService);

    const userService = container.resolve<UserService>(UserService);

    assert.ok(userService);
    assert.ok(userService.repo);
    assert.ok(userService.repo.db);
    assert.equal(userService.config.appName, 'TestFramework');
  });

  it('should pre-instantiate all singletons when initSingletons() is called', () => {
    const container = new Container();
    container.register({ provide: DB_TOKEN, useClass: DatabaseService });
    container.register(UserRepository);

    container.initSingletons();

    const db = container.resolve<DatabaseService>(DB_TOKEN);
    assert.ok(db);
  });

  it('should throw ContainerError when providing an unregistered token', () => {
    const container = new Container();

    assert.throws(
      () => {
        container.resolve('NON_EXISTENT');
      },
      (err: unknown) => {
        assert.ok(err instanceof ContainerError);
        assert.ok(err.message.includes('NON_EXISTENT'));
        return true;
      },
    );
  });
});

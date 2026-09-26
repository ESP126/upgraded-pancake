import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Router } from '../index.js';

describe('Router & Route Grouping Facade', () => {
  it('should register routes via HTTP method shortcuts', () => {
    const router = new Router();

    router
      .get('/users', 'get_users_handler')
      .post('/users', 'create_user_handler')
      .put('/users/:id', 'update_user_handler')
      .delete('/users/:id', 'delete_user_handler');

    const getMatch = router.find('GET', '/users');
    assert.ok(getMatch);
    assert.equal(getMatch.handler, 'get_users_handler');

    const postMatch = router.find('POST', '/users');
    assert.ok(postMatch);
    assert.equal(postMatch.handler, 'create_user_handler');

    const deleteMatch = router.find('DELETE', '/users/usr_99');
    assert.ok(deleteMatch);
    assert.equal(deleteMatch.handler, 'delete_user_handler');
    assert.equal(deleteMatch.params['id'], 'usr_99');
  });

  it('should group routes with shared prefixes and nested groups', () => {
    const router = new Router();

    router.group('/api/v1', (v1) => {
      v1.get('/health', 'v1_health');

      v1.group('/users', (users) => {
        users.get('/', 'v1_list_users');
        users.get('/:id', 'v1_get_user');
      });
    });

    const healthMatch = router.find('GET', '/api/v1/health');
    assert.ok(healthMatch);
    assert.equal(healthMatch.handler, 'v1_health');

    const listUsersMatch = router.find('GET', '/api/v1/users');
    assert.ok(listUsersMatch);
    assert.equal(listUsersMatch.handler, 'v1_list_users');

    const getUserMatch = router.find('GET', '/api/v1/users/42');
    assert.ok(getUserMatch);
    assert.equal(getUserMatch.handler, 'v1_get_user');
    assert.equal(getUserMatch.params['id'], '42');
  });
});

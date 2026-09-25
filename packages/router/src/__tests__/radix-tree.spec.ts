import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RadixTree } from '../tree/radix-tree.js';
import { NodeType } from '../types/node-type.js';

describe('RadixTree Route Insertion & Node Splitting', () => {
  it('should insert static routes and split node prefixes on common divergence', () => {
    const tree = new RadixTree();

    tree.insert('GET', '/users/profile', 'handler_profile');
    tree.insert('GET', '/users/posts', 'handler_posts');

    const root = tree.getRoot();
    const uChild = root.getStaticChild('u');

    assert.ok(uChild);
    // The longest common prefix between 'users/profile' and 'users/posts' is 'users/p'
    assert.equal(uChild.prefix, 'users/p');

    // Remaining 'profile' -> indexed by 'r' ('rofile')
    const rChild = uChild.getStaticChild('r');
    assert.ok(rChild);
    assert.equal(rChild.prefix, 'rofile');
    assert.equal(rChild.getHandler('GET'), 'handler_profile');

    // Remaining 'posts' -> indexed by 'o' ('osts')
    const oChild = uChild.getStaticChild('o');
    assert.ok(oChild);
    assert.equal(oChild.prefix, 'osts');
    assert.equal(oChild.getHandler('GET'), 'handler_posts');
  });

  it('should register parametric routes (:id) in paramChild pointer', () => {
    const tree = new RadixTree();

    tree.insert('GET', '/users/:id', 'get_user_by_id');

    const root = tree.getRoot();
    const uChild = root.getStaticChild('u');
    assert.ok(uChild);

    const paramNode = uChild.paramChild;
    assert.ok(paramNode);
    assert.equal(paramNode.type, NodeType.PARAM);
    assert.equal(paramNode.paramName, 'id');
    assert.equal(paramNode.getHandler('GET'), 'get_user_by_id');
  });

  it('should register wildcard routes (*path) in wildcardChild pointer', () => {
    const tree = new RadixTree();

    tree.insert('GET', '/static/*filepath', 'serve_static_file');

    const root = tree.getRoot();
    const sChild = root.getStaticChild('s');
    assert.ok(sChild);

    const wildcardNode = sChild.wildcardChild;
    assert.ok(wildcardNode);
    assert.equal(wildcardNode.type, NodeType.WILDCARD);
    assert.equal(wildcardNode.paramName, 'filepath');
    assert.equal(wildcardNode.getHandler('GET'), 'serve_static_file');
  });
});

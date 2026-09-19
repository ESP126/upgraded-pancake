import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RadixNode } from '../nodes/radix-node.js';
import { NodeType } from '../types/node-type.js';

describe('RadixNode & Trie Architecture', () => {
  it('should initialize node with default STATIC type and empty prefix', () => {
    const node = new RadixNode();
    assert.equal(node.prefix, '');
    assert.equal(node.type, NodeType.STATIC);
    assert.equal(node.staticChildren.size, 0);
  });

  it('should store and retrieve static child nodes by initial character in O(1)', () => {
    const parent = new RadixNode('/u');
    const childUsers = new RadixNode('sers', NodeType.STATIC);

    parent.addStaticChild('s', childUsers);

    assert.equal(parent.getStaticChild('s'), childUsers);
    assert.equal(parent.getStaticChild('x'), undefined);
  });

  it('should store and lookup handlers indexed by uppercase HTTP methods', () => {
    const node = new RadixNode('/users');
    const getHandler = (): string => 'GET /users';
    const postHandler = (): string => 'POST /users';

    node.addHandler('GET', getHandler);
    node.addHandler('post', postHandler);

    assert.equal(node.getHandler('GET'), getHandler);
    assert.equal(node.getHandler('POST'), postHandler);
    assert.equal(node.getHandler('DELETE'), undefined);
  });
});

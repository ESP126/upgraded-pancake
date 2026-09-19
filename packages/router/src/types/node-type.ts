/**
 * Constant values representing Radix Tree HTTP classificação types.
 */
export const NodeType = {
  STATIC: 0,
  PARAM: 1,
  WILDCARD: 2,
} as const;

/**
 * Union type representing numeric Radix Tree node types.
 */
export type NodeType = (typeof NodeType)[keyof typeof NodeType];

/**
 * Internal system metadata key constants used by the Dependency Injection engine.
 */
export const METADATA_KEYS = {
  PARAM_TYPES: 'design:paramtypes',
  PROPERTY_TYPES: 'design:types',
  RETURN_TYPE: 'design:returntype',
  INJECTABLE: 'framework:injectable',
  PARAM_INJECTIONS: 'framework:param_injections',
  PROPERTY_INJECTIONS: 'framework:property_injections',
  MODULE_DECLARATION: 'framework:module',
} as const;

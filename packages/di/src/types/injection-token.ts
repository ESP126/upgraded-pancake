/**
 * Generic type for class constructor functions.
 */
export type Newable<T = unknown> = new (...args: never[]) => T;

/**
 * Union type representing valid dependency injection lookup tokens.
 */
export type InjectionToken<T = unknown> = string | symbol | Newable<T>;

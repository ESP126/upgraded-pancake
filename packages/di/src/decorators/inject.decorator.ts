import { MetadataStorage } from '../metadata/metadata-storage.js';
import { METADATA_KEYS } from '../metadata/metadata-keys.js';
import type { InjectionToken } from '../types/injection-token.js';

/**
 * Parameter or Property decorator used to specify a custom injection token.
 *
 * @param token -  The unique injection token or identifier.
 * @returns Combined Parameter and Property decorator function.
 */
export function Inject(token: InjectionToken): ParameterDecorator & PropertyDecorator {
  return (target: object, propertyKey?: string | symbol, parameterIndex?: number): void => {
    if (typeof parameterIndex === 'number') {
      // Parameter Decorator
      MetadataStorage.addParamMetadata(
        METADATA_KEYS.PARAM_INJECTIONS,
        parameterIndex,
        token,
        target,
      );
    } else if (propertyKey !== undefined) {
      // Property Decorator
      const existing =
        MetadataStorage.getMetadata<{ propertyKey: string | symbol; token: InjectionToken }[]>(
          METADATA_KEYS.PROPERTY_INJECTIONS,
          target,
        ) ?? [];

      existing.push({ propertyKey, token });
      MetadataStorage.defineMetadata(METADATA_KEYS.PROPERTY_INJECTIONS, existing, target);
    }
  };
}

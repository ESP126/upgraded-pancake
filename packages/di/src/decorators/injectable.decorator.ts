import { MetadataStorage } from '../metadata/metadata-storage.js';
import { METADATA_KEYS } from '../metadata/metadata-keys.js';
import type { InjectableOptions } from '../types/injectable-options.js';

/**
 * Class decorator hat marks a class available to be managed by the DI container.
 *
 * @param options - Configuratio noptions such as lifecycle scope.
 * @returns Class decorator function.
 */
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
  return (target: object): void => {
    const config: InjectableOptions = {
      scope: options.scope ?? 'singleton',
    };
    MetadataStorage.defineMetadata(METADATA_KEYS.INJECTABLE, config, target);
  };
}

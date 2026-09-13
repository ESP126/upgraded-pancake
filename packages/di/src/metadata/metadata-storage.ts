/**
 * Zero-dependency native reflection metadata storage powered by WeakMap.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class MetadataStorage {
  // Target Object -> Property Key / Target -> Metadata Key -> Value
  private static readonly targetMetadata = new WeakMap<
    object,
    Map<string | symbol, Map<string, unknown>>
  >();

  /**
   * Defines a metadata value for a given target object or constructor.
   *
   * @param key - Unique string for the metadadta item.
   * @param value - The metadata payload to associate.
   * @param target - The constructor function or prototype target object.
   * @param propertyKey - Optional property or method name if property-scoped.
   */
  public static defineMetadata<T>(
    key: string,
    value: T,
    target: object,
    propertyKey: string | symbol = 'class',
  ): void {
    let targetMap = this.targetMetadata.get(target);
    if (!targetMap) {
      targetMap = new Map();
      this.targetMetadata.set(target, targetMap);
    }

    let propMap = targetMap.get(propertyKey);
    if (!propMap) {
      propMap = new Map();
      targetMap.set(propertyKey, propMap);
    }

    propMap.set(key, value);
  }

  /**
   * Retrieves a metadata value for a target and optional property key.
   *
   * @param key - Metadata key string.
   * @param target - Target object or constructor function.
   * @param propertykey - Optional property or method name.
   * @returns The stored metadata value of type T or undefined.
   */
  public static getMetadata<T>(
    key: string,
    target: object,
    propertyKey: string | symbol = 'class',
  ): T | undefined {
    const targetMap = this.targetMetadata.get(target);
    if (!targetMap) {
      return undefined;
    }

    const propMap = targetMap.get(propertyKey);
    if (!propMap) {
      return undefined;
    }

    return propMap.get(key) as T | undefined;
  }

  /**
   * Appends a parameter injection token to a constructor or method metadata array.
   *
   * @param key - Metadata array key.
   * @param index - Argument parameter index.
   * @param token - Dependency injection token or identifier.
   * @param target - Target constructor or prototype.
   * @param propertyKey - Optional property key (defaults to 'class'),
   */
  public static addParamMetadata<T>(
    key: string,
    index: number,
    token: T,
    target: object,
    propertyKey: string | symbol = 'class',
  ): void {
    const existing =
      this.getMetadata<{ index: number; token: T }[]>(key, target, propertyKey) ?? [];
    existing.push({ index, token });
    this.defineMetadata(key, existing, target, propertyKey);
  }

  /**
   * Clears all metadata associated with a specific target object.
   *
   * @param target - Target object or constructor function.
   */
  public static clear(target: object): void {
    this.targetMetadata.delete(target);
  }

  /**
   * Checks whether metadata exists for a given target and key.
   *
   * @param key - Metadata key string.
   * @param target - Target object or constructor function.
   * @param propertyKey - Optional property  or methos name.
   * @returns `true` if metadata is present, otherwise `false`.
   */
  public static hasMetadata(
    key: string,
    target: object,
    propertyKey: string | symbol = 'class',
  ): boolean {
    return this.getMetadata(key, target, propertyKey) !== undefined;
  }
}

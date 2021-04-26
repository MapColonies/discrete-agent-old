export function toBoolean(value: unknown): boolean {
  switch (typeof value) {
    case 'boolean':
      return value;
    case 'number':
    case 'bigint':
      return value !== 0;
    default:
      if ((value as string).toLowerCase() === 'true') {
        return true;
      }
      return false;
  }
}

export function projectPublicAttributes(values: unknown, definitions: any[]) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) return {};
  const source = values as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const definition of definitions || []) {
    const key = String(definition?.key || '');
    if (definition?.public !== true || !/^[a-zA-Z][a-zA-Z0-9_.-]{0,79}$/.test(key) || !(key in source)) continue;
    const value = source[key];
    const options = Array.isArray(definition.options) ? definition.options.filter((entry: unknown) => typeof entry === 'string').slice(0, 200) : [];
    switch (definition.valueType) {
      case 'text':
        if (typeof value === 'string') output[key] = value.slice(0, 500);
        break;
      case 'integer':
        if (Number.isSafeInteger(value)) output[key] = value;
        break;
      case 'decimal':
        if (typeof value === 'number' && Number.isFinite(value)) output[key] = value;
        break;
      case 'boolean':
        if (typeof value === 'boolean') output[key] = value;
        break;
      case 'date':
        if (typeof value === 'string' && Number.isFinite(Date.parse(value))) output[key] = value.slice(0, 40);
        break;
      case 'select':
        if (typeof value === 'string' && options.includes(value)) output[key] = value;
        break;
      case 'multiselect':
        if (Array.isArray(value) && value.length <= 30 && value.every((entry) => typeof entry === 'string' && options.includes(entry))) output[key] = value;
        break;
    }
  }
  return output;
}

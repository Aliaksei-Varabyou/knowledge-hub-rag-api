function removeFromSingle<T, K extends keyof T>(data: T, field: K): Omit<T, K> {
  const { [field]: _, ...result } = data as any;
  return result;
}

function removeFromArray<T, K extends keyof T>(
  data: T[],
  field: K,
): Omit<T, K>[] {
  return data.map((user) => {
    const { [field]: _, ...result } = user as any;
    return result;
  });
}

export function removeField<T, K extends keyof T>(
  data: T | T[] | undefined,
  field: K,
): Omit<T, K> | Omit<T, K>[] | undefined {
  if (data === undefined) return data;

  if (Array.isArray(data)) {
    return removeFromArray(data, field);
  } else {
    return removeFromSingle(data, field);
  }
}

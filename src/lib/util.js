export function isEmptyValue(value) {
  if (value === undefined || value === null) {
    return true;
  }
  if (Array.isArray(value) && !value.length) {
    return true;
  }
  // 在值为对象，且没有内部属性的情况下判定为空。
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return true;
  }
  if (typeof value === 'string' && !value) {
    return true;
  }
  return false;
}

export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

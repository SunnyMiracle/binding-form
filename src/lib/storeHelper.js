/*
 * @flow
 */


import nestedProperty from 'nested-property';

// 扩展支持，按表达式 get
function get(store: Object, expression: string) {
  return nestedProperty.get(store, expression);
}

// 扩展支持，按表达式 set
function set(store: Object, expression: string, value: any) {
  nestedProperty.set(store, expression, value);
}

export default {
  get,
  set
};

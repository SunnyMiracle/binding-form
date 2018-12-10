// @flow
import * as React from 'react';
import _ from 'lodash';


export type resultType = {
  identity: string,
  isCorrectValue: boolean,
  validateStatus: 'warning' | 'error' | 'success' | 'validating',
  errorMessage?: string | React.Node
}
export type standardResultType = {
  warning: (errorMessage: string | React.Node) => resultType,
  error: (errorMessage: string | React.Node) => resultType,
  success: () => resultType,
  validating: () => resultType
}
// 标志位，表明 resultType 类型的值是来自于standardResult集合方法的返回值。
// 这个值在项目初始化时赋值，具备唯一性。
const standardResultIdentityKey = _.uniqueId('standard_result');

// 验证Result对象结构是否来自于标准结果集
export function isStandardResult(type: resultType) {
  if (type.hasOwnProperty('identity')) {
    if (type.identity === standardResultIdentityKey) {
      return true;
    }
  }
  return false;
}

const standardResult: standardResultType = {
  warning: (errorMessage: string | React.Node) => {
    return {
      identity: standardResultIdentityKey,
      isCorrectValue: false,
      validateStatus: 'warning',
      errorMessage
    };
  },
  error: (errorMessage: string | React.Node) => {
    return {
      identity: standardResultIdentityKey,
      isCorrectValue: false,
      validateStatus: 'error',
      errorMessage
    };
  },
  success: () => {
    return {
      identity: standardResultIdentityKey,
      isCorrectValue: true,
      validateStatus: 'success'
    };
  },
  validating: () => {
    return {
      identity: standardResultIdentityKey,
      isCorrectValue: true,
      validateStatus: 'validating'
    };
  }
};
export default standardResult;

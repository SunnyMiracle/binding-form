// @flow

import * as React from 'react';
import _ from 'lodash';
import types from './types';
import * as util from '../lib/util';
import type {resultType, standardResultType} from '../lib/standardResult';


const functionNameTip = _.uniqueId('verificationName');

type optionsType = {
  validateStatus: 'warning' | 'error'
}

// 用户自定义验证函数--静态类型
export type validateFunctionType = (
  value: any,
  store: Object,
  standardStatus: standardResultType
) => Promise<resultType> | resultType // 异步验证情况下是返回一个Promise对象。

// localRuleType 本地验证返回类型
export type localRuleType = {
  identity: string,
  method: () => validateFunctionType
};

/**
 * 验证参数options格式是否正确
 * @param options
 */
function validateOptions(options) {
  if (options === undefined) {
    throw new Error('options 必要参数。');
  }
  if (options.hasOwnProperty('validateStatus')) {
    if (options.validateStatus !== 'warning' && options.validateStatus !== 'error') {
      throw new Error('options.validateStatus 必须是字符串warning或者error。');
    }
  }
}

/**
 * 验证用户自定义函数是否不合法
 * @return {bool} result 返回TRUE表示为基本的验证函数，FALSE表示不是基本的
 */
export function isBaseVerification(identity: string) {
  return functionNameTip === identity.split('-')[0];
}

/**
 * 验证为空的情况，验证对象不能为空，为空返回错误信息。
 * @param message
 * @param options
 * @return {function(*=, *=)}
 */
export function required(message?: string | React.Node, options: optionsType) {
  validateOptions(options);
  return {
    identity: `${functionNameTip}-required`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      if (util.isEmptyValue(value)) {
        return options.validateStatus ? standardStatus[options.validateStatus](message) : standardStatus.error(message);
      }
      return standardStatus.success();
    }
  };
}

/**
 * 验证值是否为空格，空格时返回错误信息。
 * @param options
 * @param {string | node} message
 */
export function whitespace(message: string | React.Node, options: optionsType) {
  validateOptions(options);
  return {
    identity: `${functionNameTip}-whitespace`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      if (/^\s+$/.test(value)) {
        return options.validateStatus ? standardStatus[options.validateStatus](message) : standardStatus.error(message);
      }
      return standardStatus.success();
    }
  };
}

/**
 * 验证浮点型输入项，验证规则为是小数型且必须规定小数点后几位（精确度）
 * 不是浮点型数据，返回错误验证文案。精确度不对的返回错误验证文案。
 * @param message 错误文案
 * @param options
 * @param options.accuracy 精确度
 * @param options.ignoreRadixPointZoneNumber 是否忽略小数点后连续为零的数位，默认为TRUE
 * @return {function(Object, string)}
 */
export function verifyFloat(
  message: string | React.Node,
  options: {
    validateStatus: 'warning' | 'error',
    accuracy?: number,
    ignoreRadixPointZoneNumber?: boolean
  }
) {
  validateOptions(options);
  return {
    identity: `${functionNameTip}-verifyFloat`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      const numberValue = Number(value);
      const stringValue = String(value);
      if (types('float')(numberValue)) {
        if (options.accuracy) {
          const len = stringValue.split('.')[1].length;
          if (len !== options.accuracy) {
            return options.validateStatus ?
              standardStatus[options.validateStatus](message) : standardStatus.error(message);
          } else if (len === options.accuracy) {
            return standardStatus.success();
          }
        } else {
          return standardStatus.success();
        }
      } else if (types('integer')(numberValue)) {
        const splitResult = stringValue.split('.');
        if (splitResult.length === 1) {
          return options.validateStatus ?
            standardStatus[options.validateStatus](message) : standardStatus.error(message);
        } else {
          if (util.isEmptyValue(splitResult[1])) {
            return options.validateStatus ?
              standardStatus[options.validateStatus](message) : standardStatus.error(message);
          } else {
            if (options.ignoreRadixPointZoneNumber) {
              return options.validateStatus ?
                standardStatus[options.validateStatus](message) : standardStatus.error(message);
            }
            return standardStatus.success();
          }
        }
      }
      return options.validateStatus ? standardStatus[options.validateStatus](message) : standardStatus.error(message);
    }
  };
}

/**
 * 验证最大长度，长度大于规定的maxLength，返回错误信息。字符串类型以及数组类型。
 * @param message
 * @param options
 * @param options.maxLength
 * @param options.type
 * @return {function(Object, string)}
 */
export function verifyMaxLength(
  message: string | React.Node,
  options: {
    validateStatus: 'warning' | 'error',
    maxLength: number,
    type: 'string' | 'array'
  }
) {
  if (!types('number')(options.maxLength)) {
    throw new Error(`your params maxNum ${options.maxLength} is error, must be a number`);
  }
  if (options.type !== 'string' && options.type !== 'array') {
    throw new Error(`your params type ${options.type} is error, it must be "string" or "array".`);
  }
  validateOptions(options);
  return {
    identity: `${functionNameTip}-verifyMaxLength`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      switch (options.type) {
        case 'string': {
          const length = String(value).length;
          if (length > options.maxLength) {
            return options.validateStatus ?
              standardStatus[options.validateStatus](message) : standardStatus.error(message);
          }
          return standardStatus.success();
        }
        case 'array': {
          if (!types('array')(value)) {
            throw new Error('make sure this field value is an array.');
          }
          const length = value.length;
          if (length > options.maxLength) {
            return options.validateStatus ?
              standardStatus[options.validateStatus](message) : standardStatus.error(message);
          }
          return standardStatus.success();
        }
        default: {
          throw new Error('this type is illegal.');
        }
      }
    }
  };
}

/**
 * 验证最小长度，长度小于规定的minLength，返回错误信息。只验证字符串以及数组类型。
 * @param message
 * @param options
 * @return {function(Object, string)}
 */
export function verifyMinLength(
  message: string | React.Node,
  options: {
    validateStatus: 'warning' | 'error',
    minLength: number,
    type: 'string' | 'array'
  }
) {
  if (!types('number')(options.minLength)) {
    throw new Error(`your params maxNum ${options.minLength} is error, must be a number`);
  }
  if (options.type !== 'string' && options.type !== 'array') {
    throw new Error(`your params type ${options.type} is error, it must be "string" or "array".`);
  }
  validateOptions(options);
  return {
    identity: `${functionNameTip}-verifyMinLength`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      switch (options.type) {
        case 'string': {
          const length = String(value).length;
          if (length < options.minLength) {
            return options.validateStatus ?
              standardStatus[options.validateStatus](message) : standardStatus.error(message);
          }
          return standardStatus.success();
        }
        case 'array': {
          if (!types('array')(value)) {
            throw new Error('make sure this field value is an array.');
          }
          const length = value.length;
          if (length < options.minLength) {
            return options.validateStatus ?
              standardStatus[options.validateStatus](message) : standardStatus.error(message);
          }
          return standardStatus.success();
        }
        default: {
          throw new Error('this type is illegal.');
        }
      }
    }
  };
}

/**
 * 验证长度范围，长度小于规定的最小长度range.min或者大于规定的最大长度range.max，返回错误信息，只验证字符串以及数组类型。
 * range.max与range.min的值可以相等，相等的时候可以验证规定的长度值。
 * @param message
 * @param options
 * @return {function(Object, string)}
 */
export function rangeLength(
  message: string | React.Node,
  options: {
    validateStatus: 'warning' | 'error',
    type: 'string' | 'array',
    min: number,
    max: number
  }
) {
  if (!types('object')(options)) {
    throw new Error(`your params range ${options.toString()} is error, must be an object.`);
  } else {
    if (!types('number')(options.max)) {
      throw new Error(`you params rang.max ${options.max} is error, must be a number.`);
    }
    if (!types('number')(options.min)) {
      throw new Error(`you params rang.max ${options.min} is error, must be a number.`);
    }
  }
  if (options.type !== 'string' && options.type !== 'array') {
    throw new Error(`your params type ${options.type} is error, it must be "string" or "array".`);
  }
  validateOptions(options);
  return {
    identity: `${functionNameTip}-rangeLength`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      switch (options.type) {
        case 'string': {
          const length = String(value).length;
          if (length < options.min || length > options.max) {
            return options.validateStatus ?
              standardStatus[options.validateStatus](message) : standardStatus.error(message);
          }
          return standardStatus.success();
        }
        case 'array': {
          if (!types('array')(value)) {
            throw new Error('make sure this field value is an array.');
          }
          const length = value.length;
          if (length < options.min || length > options.max) {
            return options.validateStatus ?
              standardStatus[options.validateStatus](message) : standardStatus.error(message);
          }
          return standardStatus.success();
        }
        default: {
          throw new Error('this type is illegal.');
        }
      }
    }
  };
}

/**
 * 验证当前对象是不是一个数字类型，如果不是返回错误信息，是数字类型的返回正确信息
 * @param message
 * @param options
 * @return {{identity: string, method: function(Object, string)}}
 */
export function verifyNumber(message: string | React.Node, options: optionsType) {
  validateOptions(options);
  return {
    identity: `${functionNameTip}-verifyNumber`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      if (!types('number')(Number(value))) {
        return options.validateStatus ? standardStatus[options.validateStatus](message) : standardStatus.error(message);
      }
      return standardStatus.success();
    }
  };
}

/**
 * 验证当前值是否是一个整数。不是整数返回错误信息，是整数返回标准正确信息
 * @param message
 * @param options
 * @return {{identity: string, method: function(Object, string)}}
 */
export function verifyInteger(message: string | React.Node, options: optionsType) {
  validateOptions(options);
  return {
    identity: `${functionNameTip}-verifyInteger`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      if (!types('integer')(value)) {
        return options.validateStatus ? standardStatus[options.validateStatus](message) : standardStatus.error(message);
      }
      return standardStatus.success();
    }
  };
}

/**
 * 验证当前对象是否大于规定的最大值，大于的话返回错误信息，不大于的话返回正确信息。
 * @param message
 * @param options
 * @param options.maxNum
 * @return {{identity: string, method: function(Object, string)}}
 */
export function verifyMaxNum(
  message: string | React.Node,
  options: {
    maxNum: number,
    validateStatus: 'warning' | 'error'
  }
) {
  if (!types('number')(options.maxNum)) {
    throw new Error(`your params maxNum ${options.maxNum} is error, must be a number`);
  }
  validateOptions(options);
  return {
    identity: `${functionNameTip}-verifyMaxNum`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      if (value > options.maxNum) {
        return options.validateStatus ? standardStatus[options.validateStatus](message) : standardStatus.error(message);
      }
      return standardStatus.success();
    }
  };
}

/**
 * 验证当前对象是否小于规定的最小值，小于的话返回错误信息，不小于的话返回正确信息。
 * @param message
 * @param options
 * @param options.minNum
 * @return {{identity: string, method: function(Object, string)}}
 */
export function verifyMinNum(
  message: string | React.Node,
  options: {
    validateStatus: 'warning' | 'error',
    minNum: number
  }
) {
  if (!types('number')(options.minNum)) {
    throw new Error(`your params maxNum ${options.minNum} is error, must be a number`);
  }
  validateOptions(options);
  return {
    identity: `${functionNameTip}-verifyMinNum`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      if (value < options.minNum) {
        return options.validateStatus ? standardStatus[options.validateStatus](message) : standardStatus.error(message);
      }
      return standardStatus.success();
    }
  };
}

/**
 * 验证当前对象的数值是否在某一个范围内，如果不是的话，返回错误信息，如果是的话返回正确信息。
 * @param message
 * @param options
 * @return {{identity: string, method: function(Object, string)}}
 */
export function verifyRangeNum(
  message: string | React.Node,
  options: {
    validateStatus: 'warning' | 'error',
    max: number,
    min: number
  }
) {
  if (!types('object')(options)) {
    throw new Error(`your params range ${options.toString()} is error, must be an object.`);
  } else {
    if (!types('number')(options.max)) {
      throw new Error(`you params rang.max ${options.max} is error, must be a number.`);
    }
    if (!types('number')(options.min)) {
      throw new Error(`you params rang.max ${options.min} is error, must be a number.`);
    }
  }
  validateOptions(options);
  return {
    identity: `${functionNameTip}-verifyRangeNum`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      const valueNum = Number(value);
      if (valueNum > options.max || valueNum < options.min) {
        return options.validateStatus ? standardStatus[options.validateStatus](message) : standardStatus.error(message);
      }
      return standardStatus.success();
    }
  };
}

/**
 * 验证当前对象是不是一个email格式的文本，如果不是的话返回错误信息，如果格式正确返回正确信息
 * @param message
 * @param options
 * @return {{identity: string, method: function()}}
 */
export function verifyEmail(message: string | React.Node, options: optionsType) {
  validateOptions(options);
  return {
    identity: `${functionNameTip}-verifyEmail`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      if (!types('email')(value)) {
        return options.validateStatus ? standardStatus[options.validateStatus](message) : standardStatus.error(message);
      }
      return standardStatus.success();
    }
  };
}

/**
 * 验证当前对象是不是一个URL格式的文本，如果不是的话返回错误信息，如果格式正确返回正确信息
 * @param message
 * @param options
 * @return {{identity: string, method: function()}}
 */
export function verifyUrl(message: string | React.Node, options: optionsType) {
  validateOptions(options);
  return {
    identity: `${functionNameTip}-verifyUrl`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      if (!types('url')(value)) {
        return options.validateStatus ? standardStatus[options.validateStatus](message) : standardStatus.error(message);
      }
      return standardStatus.success();
    }
  };
}

/**
 * 验证当前对象是不是一个十六进制格式的文本，如果不是返回错误信息，如果格式正确返回正确信息
 * @param message
 * @param options
 * @return {{identity: string, method: function()}}
 */
export function verifyHex(message: string | React.Node, options: optionsType) {
  validateOptions(options);
  return {
    identity: `${functionNameTip}-verifyHex`,
    method: (value: any, store: Object, standardStatus: standardResultType) => {
      if (!types('hex')(value)) {
        return options.validateStatus ? standardStatus[options.validateStatus](message) : standardStatus.error(message);
      }
      return standardStatus.success();
    }
  };
}

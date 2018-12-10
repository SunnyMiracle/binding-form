/* eslint max-len:0 */
import {isObservableArray} from 'mobx';

const pattern = {
  // http://emailregex.com/
  email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, // eslint-disable-line no-useless-escape
  url: new RegExp('^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$', 'i'),
  hex: /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i,
};

const types = {
  integer(value) {
    return types.number(value) && parseInt(value, 10) === value;
  },
  float(value) {
    return types.number(value) && !types.integer(value);
  },
  array(value) {
    // 兼容Mobx数据下数组型结构，Array.isArray(value)返回FALSE的情况。
    return Array.isArray(value) || isObservableArray(value);
  },
  regexp(value) {
    if (value instanceof RegExp) {
      return true;
    }
    try {
      return !!new RegExp(value);
    } catch (e) {
      return false;
    }
  },
  date(value) {
    return typeof value.getTime === 'function' &&
      typeof value.getMonth === 'function' &&
      typeof value.getYear === 'function';
  },
  number(value) {
    if (isNaN(value)) {
      return false;
    }
    return typeof (value) === 'number';
  },
  object(value) {
    return typeof (value) === 'object' && !types.array(value);
  },
  method(value) {
    return typeof (value) === 'function';
  },
  email(value) {
    return typeof (value) === 'string' && !!value.match(pattern.email) && value.length < 255;
  },
  url(value) {
    return typeof (value) === 'string' && !!value.match(pattern.url);
  },
  hex(value) {
    return typeof (value) === 'string' && !!value.match(pattern.hex);
  },
};

/**
 *  Rule for validating the type of a value.
 *
 *  @param rule The validation rule.
 *  @return validation function
 */
function type(rule) {
  const custom = ['integer', 'float', 'array', 'regexp', 'object', 'method', 'email', 'number', 'date', 'url', 'hex'];
  if (custom.indexOf(rule) < 0) {
    throw new Error(`this validation type ${rule}, is illegal`);
  }
  return types[rule];
}

export default type;


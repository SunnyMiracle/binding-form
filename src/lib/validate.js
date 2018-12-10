import _ from 'lodash';
import types from '../rules/types';
import * as baseRule from '../rules/basic';
import storeHelper from './storeHelper';
import standardResult, {isStandardResult} from './standardResult';


/**
 * 处理验证优先级逻辑，以及去掉重复验证函数
 * 验证函数会按照先后顺序依次执行，报错后终止。
 * 验证分成基本内置验证，以及用户自动验证（包括同步以及异步）
 * contextRules是来自FieldSet上规定的验证规则，propRules来自于Field上的规则。
 * 如果contextRules中与propRules中有相同类型的内置验证规则，则舍弃contextRules的。
 * 验证顺序为contextRules -> propRules。contextRules中有舍弃的情况下，propRules的对应类型补位。
 */
export function mergeRules(contextRules, propRules) {
  const resultRules = {};
  // 处理context上的规范验证函数
  if (Array.isArray(contextRules)) {
    contextRules.forEach((ruleItem) => {
      if (types('object')(ruleItem) && baseRule.isBaseVerification(ruleItem.identity)) {
        resultRules[ruleItem.identity] = ruleItem.method;
      } else if (types('method')(ruleItem)) {
        resultRules[_.uniqueId('customRule')] = ruleItem;
      } else {
        throw new Error('验证规则格式不正确，请更改。验证规则支持组件内置函数同时支持用户自定义函数。');
      }
    });
  } else if (contextRules) {
    if (types('object')(contextRules) && baseRule.isBaseVerification(contextRules.identity)) {
      resultRules[contextRules.identity] = contextRules.method;
    } else if (types('method')(contextRules)) {
      resultRules[_.uniqueId('customRule')] = contextRules;
    } else {
      throw new Error('验证规则格式不正确，请更改。验证规则支持组件内置函数同时支持用户自定义函数。');
    }
  }

  // 处理用户传入的规范验证函数
  if (Array.isArray(propRules)) {
    propRules.forEach((ruleItem) => {
      if (types('object')(ruleItem) && baseRule.isBaseVerification(ruleItem.identity)) {
        // contextRules中已经存在的内置验证方法，在这里做替换操作，没有的则是新加。
        resultRules[ruleItem.identity] = ruleItem.method;
      } else if (types('method')(ruleItem)) {
        resultRules[_.uniqueId('customRule')] = ruleItem;
      } else {
        throw new Error('验证规则格式不正确，请更改。验证规则支持组件内置函数同时支持用户自定义函数。');
      }
    });
  } else if (propRules) {
    if (types('object')(propRules) && baseRule.isBaseVerification(propRules.identity)) {
      // contextRules中已经存在的内置验证方法，在这里做替换操作，没有的则是新加。
      resultRules[propRules.identity] = propRules.method;
    } else if (types('method')(propRules)) {
      resultRules[_.uniqueId('customRule')] = propRules;
    } else {
      throw new Error('验证规则格式不正确，请更改。验证规则支持组件内置函数同时支持用户自定义函数。');
    }
  }

  return Object.keys(resultRules).map((key) => {
    return {
      uniqueKey: key,
      method: resultRules[key]
    };
  });
}


/**
 * 根据入参获取到对应的数值，并且返回一个新的数据，不影响原store数据
 * @param store
 * @param valueKey
 * @return {*}
 */
function getValueFromStore(store, valueKey) {
  let tempValue;
  if (types('array')(storeHelper.get(store, valueKey))) {
    tempValue = storeHelper.get(store, valueKey).map((item) => {
      return item;
    });
  } else if (types('object')(storeHelper.get(store, valueKey))) {
    tempValue = {
      ...storeHelper.get(store, valueKey)
    };
  } else {
    tempValue = '';
    tempValue = storeHelper.get(store, valueKey);
  }
  return tempValue;
}

// 验证结果的来源，正确性。
function resultValidation(result) {
  if (!isStandardResult(result)) {
    throw new Error('请检查验证函数返回值是否来自于标准验证集合（回调函数的第三个参数）内分支函数的执行结果。');
  }
}

/**
 * 当前值是否正确，以及错误时对应的提示文案
 * 验证函数集合会包装成一个数组来处理，验证规则的优先级即为各个验证规则在数组中的顺序。
 * 如果前一个验证规则返回标准的验证失败（standardErrorResult()）的结果，则不会执行后边的验证函数。
 * 如果验证到最后一个还没有返回标准的验证失败结果，也就是说验证规则全部通过了，则需要返回标准的正确验证结果，以保证逻辑上正确。
 *
 * 另外需要增加现在，如果当前组件是disabled为TRUE的情况下，直接resolve()正确验证结果即可，不在进行具体的逻辑验证或者异步验证。
 */
export function verifyField(stateVerificationRules, formStore, valueKey) {
  return new Promise((resolve, reject) => {
    let result = {
      isCorrectValue: true,
      validateStatus: 'success',
      errorMessage: ''
    };

    const verificationRulesLength = stateVerificationRules.length;
    // 如果当前的验证规则长度为零的话，表明当前Field没有设置验证规则，需要直接resolve正确结果即可
    if (verificationRulesLength > 0) {
      for (let i = 0; i < verificationRulesLength; i++) {
        if (stateVerificationRules[i].uniqueKey.indexOf('customRule') >= 0) {
          let tempResult = {
            isCorrectValue: true,
            validateStatus: 'success',
            errorMessage: ''
          };
          if (result.isCorrectValue) {
            const customRuleResult =
              stateVerificationRules[i].method(getValueFromStore(formStore, valueKey), formStore, standardResult);
            if (types('object')(customRuleResult) && customRuleResult.then === undefined) {
              resultValidation(customRuleResult);
              tempResult = {...customRuleResult};
              if (!tempResult.isCorrectValue) {
                result = {
                  isCorrectValue: tempResult.isCorrectValue,
                  validateStatus: tempResult.validateStatus,
                  errorMessage: tempResult.errorMessage
                };
                resolve(result);
              } else if (i === verificationRulesLength - 1 && tempResult.isCorrectValue) {
                result = {...tempResult};
                resolve(result);
              }
            } else if (typeof customRuleResult.then === 'function') {
              customRuleResult.then((res) => { // eslint-disable-line
                if (types('object')(customRuleResult)) {
                  resultValidation(res);
                  tempResult = res;
                  if (!tempResult.isCorrectValue) {
                    result = {
                      isCorrectValue: tempResult.isCorrectValue,
                      validateStatus: tempResult.validateStatus,
                      errorMessage: tempResult.errorMessage
                    };
                    resolve(result);
                  } else if (i === verificationRulesLength - 1 && tempResult.isCorrectValue) {
                    result = {...tempResult};
                    resolve(result);
                  }
                } else {
                  throw new Error('请确保自定义验证函数有返回标准的验证集合（回调函数的第三个参数）分支函数的执行结果。');
                }
              });
            } else if (typeof customRuleResult.then !== 'function') {
              throw new Error('确保自定义、异步验证函数返回一个Promise对象。');
            } else {
              throw new Error('请确保自定义验证函数有返回标准的验证集合（回调函数的第三个参数）分支函数的执行结果。');
            }
          }
        } else {
          let tempResult = {
            isCorrectValue: true,
            validateStatus: 'success',
            errorMessage: ''
          };
          if (result.isCorrectValue) {
            tempResult =
              stateVerificationRules[i].method(getValueFromStore(formStore, valueKey), formStore, standardResult);
            resultValidation(tempResult);
          }
          if (!tempResult.isCorrectValue) {
            result = {
              isCorrectValue: tempResult.isCorrectValue,
              validateStatus: tempResult.validateStatus,
              errorMessage: tempResult.errorMessage
            };
            resolve(result);
          } else if (i === verificationRulesLength - 1 && tempResult.isCorrectValue) {
            result = {...tempResult};
            resolve(result);
          }
        }
      }
    } else {
      resolve(result);
    }
  });
}

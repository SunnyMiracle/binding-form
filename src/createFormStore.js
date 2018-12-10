// @flow
import * as React from 'react';
import {toJS, action, observable} from 'mobx';
import {verifyField} from './lib/validate';
import storeHelper from './lib/storeHelper';

// 保留字段合集
// TODO 不需要禁用这么多API，善用 symbol 和 闭包
export const selfKeys = [
  'addInstance',
  'deleteInstance',
  'updateInstance',
  'getInstance',
  'validateFieldsAndScroll',
  'resetFields',
  'setValue',
];

// 实例对象集合的symbol对象
const InstanceListSymbol = Symbol('instance');


export type InstanceType = {
  valueKey: string,
  validateRule: Array<{
    uniqueKey: string,
    method: () => {
      isCorrectValue: boolean,
      errorMessage?: string
    }
  }>,
  verifyThisField?: () => Promise<{
    isCorrectValue: boolean,
    errorMessage?: string | React.Node
  }>,
  updateFieldState: (state: {
    isCorrectValue: boolean,
    errorMessage?: string,
    validateStatus: 'warning' | 'error' | 'success' | 'validating',
  }) => void,
  ignoreDisplayError?: boolean,
  isCorrectValue: boolean,
  errorMessage: string | React.Node,
  validateStatus: 'warning' | 'error' | 'success' | 'validating',
  isVisible: boolean,
  disabled?: boolean
}

// 验证函数返回的结果，validateFieldsAndScroll 返回值Promise对象返回
export type ValidationResultType = {
  errorList: Array<InstanceType>,
  state: {}
};

export type FormStoreDataType = {
  [key: Symbol | string]: Map<string, InstanceType> | any, // TODO 这样写貌似不对，FLow不支持用symbol对象作为key
  addInstance?: (ids: string, target: InstanceType) => void,
  deleteInstance?: (ids: string) => void,
  getInstance?: (ids?: string) => InstanceType,
  validateFieldsAndScroll?: () => Promise<ValidationResultType>,
  setValue?: (key: string, value: any) => void,
  resetFields?: () => void,
  getState?: () => {},
  toJSON?: () => {}
}

function createFormStore<T: FormStoreDataType>(data: T): T {
  const MBData = observable(data);
  const tempCopyData = toJS(MBData);
  Object.keys(tempCopyData).forEach((key) => {
    if (selfKeys.indexOf(key) > 0) {
      throw new Error(`your observable data's key [${key}] is not allow, please change it.`);
    }
  });

  // 验证函数
  function verifyThisField() {
    this.updateFieldState({
      isCorrectValue: true,
      errorMessage: '',
      validateStatus: 'validating'
    });
    if (this.isVisible && !this.disabled) {
      return verifyField(
        this.validateRule,
        MBData,
        this.valueKey,
      ).then((res) => {
        this.isCorrectValue = res.isCorrectValue;
        this.errorMessage = res.errorMessage;
        this.validateStatus = !this.ignoreDisplayError ? res.validateStatus : 'success';
        this.updateFieldState({
          isCorrectValue: this.isCorrectValue,
          errorMessage: this.errorMessage,
          validateStatus: this.validateStatus
        });
        return res;
      });
    }
    return new Promise((resolve, reject) => {
      this.updateFieldState({
        isCorrectValue: true,
        errorMessage: '',
        validateStatus: 'success'
      });
      resolve({
        isCorrectValue: true,
        errorMessage: '',
        validateStatus: 'success'
      });
    });
  }

  // 处理Field实例上的数据，例如处理可见性isVisible
  function handingTargetData(ids: string, target: InstanceType) {
    const temp = {
      ...target,
      verifyThisField
    };
    MBData[InstanceListSymbol].set(ids, temp);
  }

  MBData[InstanceListSymbol] = new Map();
  MBData.addInstance = action((ids: string, target: InstanceType) => {
    handingTargetData(ids, target);
  });
  MBData.deleteInstance = action((ids: string) => {
    const result = MBData[InstanceListSymbol].delete(ids);
    if (!result) { // 貌似没必要
      throw new Error('当前实例删除失败');
    }
  });
  MBData.getInstance = action((ids?: string) => {
    if (ids) {
      return MBData[InstanceListSymbol].get(ids);
    }
    return MBData[InstanceListSymbol];
  });
  MBData.validateFieldsAndScroll = () => {
    const promiseList = [];
    const errorIdsList = [];
    const errorList = [];
    MBData[InstanceListSymbol].forEach((instanceItem, ids, instanceList) => {
      promiseList.push(
        new Promise((resolve, reject) => {
          if (instanceItem.verifyThisField) {
            instanceItem.verifyThisField().then((res) => {
              if (!res.isCorrectValue) {
                errorIdsList.push(ids);
                errorList.push(instanceItem);
              }
              resolve(res);
            });
          }
        })
      );
    });
    return Promise.all(promiseList).then(() => {
      errorIdsList.sort((item: string, prevItem: string) => {
        return Number(item.split('base_frame_component')[1]) - Number(prevItem.split('base_frame_component')[1]);
      });
      if (errorIdsList.length > 0) {
        const target: HTMLElement | any = document.getElementById(errorIdsList[0]);
        target.scrollIntoView();
      }
      return {
        errorList,
        state: typeof MBData.getState === 'function' ? MBData.getState() : {}
      };
    });
  };
  MBData.setValue = action((key, value) => {
    MBData[key] = value;
  });
  MBData.resetFields = action(() => {
    Object.keys(tempCopyData).forEach((key: any) => { // 为了兼容key值的不确定性，可能是字符串，可能是symbol对象，等等。
      if (typeof MBData.setValue === 'function') {
        MBData.setValue(key, tempCopyData[key]);
      }
    });
  });

  MBData.getState = () => {
    const result = {};
    MBData[InstanceListSymbol].forEach((instanceItem, ids, instanceList) => {
      if (instanceItem.isVisible) {
        storeHelper.set(result, instanceItem.valueKey, toJS(storeHelper.get(MBData, instanceItem.valueKey)));
      }
    });
    return result;
  };
  MBData.toJSON = () => {
    return toJS(MBData);
  };

  selfKeys.forEach((key) => {
    if (key !== 'instanceList') {
      Object.defineProperty(MBData, key, {
        configurable: false, // 不可删除
        enumerable: false, // 不可枚举
        writable: false
      });
    }
  });
  Object.defineProperty(MBData, InstanceListSymbol, {
    configurable: false, // 不可删除
    enumerable: false // 不可枚举
  });
  return MBData;
}
export default createFormStore;

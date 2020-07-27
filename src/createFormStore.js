// @flow
import * as React from 'react';
import {toJS, action, observable} from 'mobx';
import {verifyField} from './lib/validate';
import storeHelper from './lib/storeHelper';

// 实例对象集合的symbol对象
export const InstanceListSymbol = Symbol('instance');
export const addInstanceSymbol = Symbol('addInstance');
export const deleteInstanceSymbol = Symbol('deleteInstance');
export const getInstanceSymbol = Symbol('getInstance');
export const validateFieldsAndScrollSymbol = Symbol('validateFieldsAndScroll');
export const getStateSymbol = Symbol('getState');

// 表单中每一项的实例数据。
export type InstanceType = {
  ids: string,
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
  ignoreDisplayError?: boolean,
  isCorrectValue: boolean,
  errorMessage: string | React.Node,
  validateStatus: 'warning' | 'error' | 'success' | 'validating',
  isVisible: boolean,
  disabled?: boolean,
  colon: boolean,
}

// 验证函数返回的结果，validateFieldsAndScroll 返回值Promise对象返回
export type ValidationResultType = {
  errorList: Array<InstanceType>,
  state: {}
};

export type FormStoreDataType = {
  [key: Symbol]: Map<string, InstanceType> | any,
}

function createFormStore<T: FormStoreDataType>(data: T):
  [T, () => Promise<ValidationResultType>, () => Object, (ids?: string) => InstanceType | Map<string, InstanceType>]
{
  const MBData = observable(data);

  // 验证函数
  function verifyThisField() {
    this.isCorrectValue = true;
    this.errorMessage = '';
    this.validateStatus = 'validating';
    if (this.isVisible && !this.disabled) {
      return verifyField(
        this.validateRule,
        MBData,
        this.valueKey,
      ).then((res) => {
        this.isCorrectValue = res.isCorrectValue;
        this.errorMessage = res.errorMessage;
        this.validateStatus = !this.ignoreDisplayError ? res.validateStatus : 'success';
        return res;
      });
    }
    return new Promise((resolve, reject) => {
      this.isCorrectValue = true;
      this.errorMessage = '';
      this.validateStatus = 'success';
      resolve({
        isCorrectValue: true,
        errorMessage: '',
        validateStatus: 'success'
      });
    });
  }
  MBData[InstanceListSymbol] = observable.map(new Map());
  MBData[addInstanceSymbol] = action((ids: string, target: InstanceType) => {
    MBData[InstanceListSymbol].set(ids, {...target, verifyThisField});
  });
  MBData[deleteInstanceSymbol] = action((ids: string) => {
    const result = MBData[InstanceListSymbol].delete(ids);
    if (!result) { // 貌似没必要
      throw new Error('当前实例删除失败');
    }
  });
  MBData[getInstanceSymbol] = action((ids?: string) => {
    if (ids) {
      return MBData[InstanceListSymbol].get(ids);
    }
    return MBData[InstanceListSymbol];
  });
  MBData[validateFieldsAndScrollSymbol] = () => {
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
        state: typeof MBData[getStateSymbol] === 'function' ? MBData[getStateSymbol]() : {}
      };
    });
  };
  MBData[getStateSymbol] = () => {
    const result = {};
    MBData[InstanceListSymbol].forEach((instanceItem, ids, instanceList) => {
      if (instanceItem.isVisible) {
        storeHelper.set(result, instanceItem.valueKey, toJS(storeHelper.get(MBData, instanceItem.valueKey)));
      }
    });
    return result;
  };
  return [MBData, MBData[validateFieldsAndScrollSymbol], MBData[getStateSymbol], MBData[getInstanceSymbol]];
}
export default createFormStore;

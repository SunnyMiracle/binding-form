// @flow
import * as React from 'react';
import {observer} from 'mobx-react';
import type {localRuleType, validateFunctionType} from './rules/basic';
import type {FormStoreDataType} from './createFormStore';

type FieldSetPropTypes = {
  children: React.Node,
  /**
   * 是否可见，不可见的情况下Form是无法获取这部分的数据的
   */
  isVisible?: boolean | (store: FormStoreDataType) => boolean,
  hideRequiredMark?: boolean,
  colon?: boolean,
  labelCol?: {},
  wrapperCol?: {},
  rules?: (localRuleType | validateFunctionType) | Array<localRuleType | validateFunctionType>, // 验证规则
  disabled?: boolean | (store: FormStoreDataType) => boolean // 是否不可用状态，将传导影响Field层
}

// 创建Context组件
export const FieldSetContext = React.createContext();


@observer
export default class FieldSet extends React.Component<FieldSetPropTypes> {

  getContextData = () => {
    return {
      rules: this.props.rules,
      labelCol: this.props.labelCol,
      wrapperCol: this.props.wrapperCol,
      colon: this.props.colon,
      fieldSetHideRequiredMark: this.props.hideRequiredMark,
      isVisible: this.props.isVisible,
      disabled: this.props.disabled,
    };
  };

  render() {
    return (
      <FieldSetContext.Provider
        value={this.getContextData()}
      >
        {this.props.children}
      </FieldSetContext.Provider>
    );
  }

}

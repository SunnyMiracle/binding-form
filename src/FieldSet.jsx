// @flow
import * as React from 'react';
import type {localRuleType, validateFunctionType} from './rules/basic';
import type {FormStoreDataType} from './createFormStore';
import { FormContext } from './Form';

type FieldSetPropTypes = {
  children: React.Node,
  /**
   * 是否可见，不可见的情况下Form是无法获取这部分的数据的
   */
  isVisible?: boolean | (store: FormStoreDataType) => boolean,
  hideRequiredMark?: boolean,
  colon?: boolean,
  labelCol?: { span: number, offset: number },
  wrapperCol?: { span: number, offset: number },
  rules?: (localRuleType | validateFunctionType) | Array<localRuleType | validateFunctionType>, // 验证规则
  disabled?: boolean | (store: FormStoreDataType) => boolean // 是否不可用状态，将传导影响Field层
}

export default class FieldSet extends React.Component<FieldSetPropTypes> {

  static contextType = FormContext;

  getContextData = (): any => {
    const result =  {
      rules: this.props.rules,
      labelCol: this.props.labelCol,
      wrapperCol: this.props.wrapperCol,
      colon: this.props.colon,
      fieldSetHideRequiredMark: this.props.hideRequiredMark,
      isVisible: this.props.isVisible,
      disabled: this.props.disabled,
      formStore: this.context.formStore,
      layout: this.context.layout,
      formHideRequiredMark: this.context.formHideRequiredMark,
    };
    if (this.context.layout) {
      if (this.context.layout === 'horizontal') {
        result.labelCol = this.props.labelCol || {
          span: 3,
          offset: 1
        };
        result.wrapperCol = this.props.wrapperCol || {
          span: 10,
          offset: 0
        };
      }
    }
    return result;
  };

  render() {
    return (
      <FormContext.Provider
        value={this.getContextData()}
      >
        {this.props.children}
      </FormContext.Provider>
    );
  }

}

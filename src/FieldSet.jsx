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
  colon?: boolean,
  rules?: (localRuleType | validateFunctionType) | Array<localRuleType | validateFunctionType>, // 验证规则
  disabled?: boolean | (store: FormStoreDataType) => boolean // 是否不可用状态，将传导影响Field层
}

@observer
export default class FieldSet extends React.Component<FieldSetPropTypes> {

  static childContextTypes = {
    rules: React.PropTypes.oneOfType([
      React.PropTypes.oneOfType([
        React.PropTypes.shape({}),
        React.PropTypes.func,
      ]),
      React.PropTypes.arrayOf(
        React.PropTypes.oneOfType([
          React.PropTypes.shape({}),
          React.PropTypes.func,
        ])
      )
    ]),
    isVisible: React.PropTypes.bool,
    colon: React.PropTypes.bool,
    disabled: React.PropTypes.bool,
  };

  getChildContext() {
    return {
      rules: this.props.rules,
      colon: this.props.colon,
      isVisible: this.props.isVisible,
      disabled: this.props.disabled,
    };
  }

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }

}

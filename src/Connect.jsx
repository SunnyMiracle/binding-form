// @flow
import * as React from "react";
import { FormContext } from './Form';
import type {FieldPropTypes} from "./Field";
import {mergeRules} from "./lib/validate";
import {isBaseVerification} from "./rules/basic";
import type {FormStoreDataType} from "./createFormStore";
import type {localRuleType, validateFunctionType} from "./rules/basic";
import {observable} from "mobx";

export type ContextType = {
  formStore: FormStoreDataType,
  fieldSetHideRequiredMark: boolean,
  formHideRequiredMark: boolean,
  labelCol: {},
  wrapperCol: {},
  rules: (localRuleType | validateFunctionType) | Array<localRuleType | validateFunctionType>,
  disabled: boolean,
  isVisible: boolean,
  colon: boolean
};


export default function Connect (Instance) {
  return class FieldWrap extends React.Component<FieldPropTypes> {

    // 用于计算当前组件的禁用状态，通过context.disabled和props.disabled进行推导
    getDisableStatus = (props: FieldPropTypes, context: ContextType): boolean | (store: FormStoreDataType, valueKey: string) => boolean => {
      if (props.disabled !== undefined) {
        if (typeof props.disabled === 'function') {
          return props.disabled;
        }
        return props.disabled;
      }
      if (context.disabled !== undefined) {
        if (typeof context.disabled === 'function') {
          return context.disabled;
        }
        return context.disabled;
      }
      // 如果props.disabled以及context.disabled未定义，则返回FALSE表明不是禁用状态。
      return false;
    };

    // 用于计算colon属性，意思为是否显示label后的冒号，通过context.colon 和 props.colon 进行推导
    getColonStatus = (props: FieldPropTypes, context: ContextType): boolean => {
      if (props.colon !== undefined) {
        return props.colon;
      }
      if (context.colon !== undefined) {
        return context.colon;
      }
      // 如果context.colon未定义以及props.colon未定义，则默认返回TRUE，表明需要label后边的冒号
      return true;
    };

    // 用于计算isVisible的值，通过context.isVisible 和props.isVisible进行推导
    getIsVisible = (props: FieldPropTypes, context: ContextType): boolean | (store: FormStoreDataType, valueKey: string) => boolean => {
      if (props.isVisible !== undefined) {
        if (typeof props.isVisible === 'function') {
          return props.isVisible;
        }
        return props.isVisible;
      }
      if (context.isVisible !== undefined) {
        if (typeof context.isVisible === 'function') {
          return context.isVisible;
        }
        return context.isVisible;
      }
      // 如果两层都没有设置，则默认定义为展示结果，返回TRUE
      return true;
    };

    // 用于计算最终hideRequiredMark的值，通过context.fieldSetHideRequiredMark, context.formHideRequiredMark, props.hideRequiredMark
    getIsNeedRequiredMark = (props: FieldPropTypes, context: ContextType): boolean => {
      if (props.hideRequiredMark !== undefined) { // 不是undefined，必定是布尔值，如果不是布尔值PropTypes自然会检测报错
        return !props.hideRequiredMark;
      }
      if (context.fieldSetHideRequiredMark !== undefined) {
        return !context.fieldSetHideRequiredMark;
      }
      if (context.formHideRequiredMark !== undefined) {
        return !context.formHideRequiredMark;
      }
      // 如果这三层都是undefined，则直接返回isRequiredFromState
      return false;
    };

    // 用于计算label的布局格式，通过context.labelCol 合props.labelCol进行推导
    getLabelCol = (props: FieldPropTypes, context: ContextType) => {
      if (props.labelCol !== undefined) {
        return props.labelCol;
      }
      if (context.labelCol !== undefined) {
        return context.labelCol;
      }
      return undefined;
    };

    // 用于计算wrapperCol的布局格式，通过context.wrapperCol 合props.wrapperCol进行推导
    getWrapperCol = (props: FieldPropTypes, context: ContextType) => {
      if (props.wrapperCol !== undefined) {
        return props.wrapperCol;
      }
      if (context.wrapperCol !== undefined) {
        return context.wrapperCol;
      }
      return undefined;
    };

    // 用于合并表单验证规则
    mergeRule = (props: FieldPropTypes, context: ContextType) => {
      const rules = mergeRules(context.rules, props.rules);
      let isRequired = false;
      rules.forEach((ruleItem) => {
        if (isBaseVerification(ruleItem.uniqueKey) && ruleItem.uniqueKey.indexOf('required') > 0) {
          isRequired = true;
        }
      });
      return {
        rules,
        isRequired,
      }
    };

    render() {
      return (
        <FormContext.Consumer>
          {(context: ContextType) => {
            const disabled = this.getDisableStatus(this.props, context);
            const colon = this.getColonStatus(this.props, context);
            const isVisible = this.getIsVisible(this.props, context);
            const hideRequiredMark = this.getIsNeedRequiredMark(this.props, context);
            const labelCol = this.getLabelCol(this.props, context);
            const wrapperCol = this.getWrapperCol(this.props, context);
            const ruleAndIsRequired = this.mergeRule(this.props, context);
            const resultProps: FieldPropTypes = observable({ ...this.props });
            resultProps.disabled = disabled;
            resultProps.isVisible = isVisible;
            resultProps.hideRequiredMark = hideRequiredMark;
            resultProps.labelCol = labelCol;
            resultProps.wrapperCol = wrapperCol;
            resultProps.colon = colon;
            resultProps.rules = ruleAndIsRequired.rules;
            resultProps.isRequired = ruleAndIsRequired.isRequired;
            resultProps.formStore = context.formStore;
            return (
              <Instance {...resultProps} />
            );
          }}
        </FormContext.Consumer>
      )
    }
  }
}

// @flow
import * as React from 'react';
import {Form as AntForm} from 'antd';
import {reaction} from 'mobx';
import {observer} from 'mobx-react';
import _ from 'lodash';
import storeHelper from './lib/storeHelper';
import {addInstanceSymbol, deleteInstanceSymbol, getInstanceSymbol, InstanceListSymbol} from './createFormStore';
import type {localRuleType, validateFunctionType} from './rules/basic';
import type {FormStoreDataType}  from './createFormStore';
import Connect, {ConnectContext} from "./Connect";

export type FieldPropTypes = {
  children: React.Element<any>,
  valueKey: string,
  trigger?: string, // 组件获取值的时机
  validateTrigger?: string, // 组件进行数据验证的时机
  valuePropName?: string, // 子节点值的属性，比如Switch 的是'Checked' 默认值为value
  getValueFromEvent?: (Object) => Object, // 可以劫持默认获取组件值的时机方法内拿到的值，并转换成自己想要的格式
  ignoreDisplayError?: boolean,
  rules?: (localRuleType | validateFunctionType) | Array<localRuleType | validateFunctionType>, // 验证规则，可以指定多个或者单个验证规则，默认首要验证规则为第一个
  label: string | React.Node,
  labelCol?: { span: number, offset: number },
  wrapperCol?: { span: number, offset: number },
  disabled?: boolean | (store: FormStoreDataType, valueKey: string) => boolean,
  isVisible?: boolean | (store: FormStoreDataType, valueKey: string) => boolean,
  colon?: boolean,
  hasFeedback?: boolean,
  hideRequiredMark?: boolean // 必填选项标志不再通过props传入，而是根据验证规则来推导，但是保留API可以允许不显示红色星标志。
};

const FormItem = AntForm.Item;

@observer
class Field extends React.Component<FieldPropTypes, null> {

  static defaultProps = {
    trigger: 'onChange',
    validateTrigger: 'onBlur',
    valuePropName: 'value',
  };
  static contextType = ConnectContext;

  reactionInstance: () => mixed;

  constructor(props: FieldPropTypes) {
    super(props);
    this.ids = _.uniqueId('base_frame_component');
  }
  componentDidMount() {
    this.addAndUpdateInstance({
      ids: this.ids,
      valueKey: this.props.valueKey,
      validateRule: this.props.rules,
      disabled: this.getDisabled(),
      isVisible: this.getIsVisible(),
      colon: this.props.colon,
      ignoreDisplayError: this.props.ignoreDisplayError,
    });
    this.reactionInstance = reaction(
      () => {
        return {
          isVisible: this.getIsVisible(),
          disabled: this.getDisabled(),
          ids: this.ids,
          valueKey: this.props.valueKey,
          validateRule: this.props.rules,
          ignoreDisplayError: this.props.ignoreDisplayError,
          colon: this.props.colon,
        };
      },
      (data, thisReaction) => {
        this.addAndUpdateInstance({
          isVisible: data.isVisible,
          disabled: data.disabled,
          ids: this.ids,
          valueKey: data.valueKey,
          validateRule: data.validateRule,
          ignoreDisplayError: data.ignoreDisplayError,
          colon: data.colon,
        });
      }
    );
  }
  componentWillUnmount() {
    this.context.formStore[deleteInstanceSymbol](this.ids, this.props.valueKey);
    this.reactionInstance(); // 清理定义的函数
  }
  ids: string;

  // 获取isVisible
  getIsVisible = () => {
    if (typeof this.props.isVisible === 'function') {
      return this.props.isVisible(this.context.formStore, this.props.valueKey);
    }
    return this.props.isVisible;
  }

  // 获取disabled
  getDisabled = () => {
    if (typeof this.props.disabled === 'function') {
      return this.props.disabled(this.context.formStore, this.props.valueKey);
    }
    return this.props.disabled;
  }

  // 初始化、更新Field实例的函数
  addAndUpdateInstance = (info: any) => {
    const instance = this.context.formStore[getInstanceSymbol](this.ids);
    if (instance) {
      this.context.formStore[addInstanceSymbol](this.ids, {
        ...instance,
        ...info
      });
    } else {
      this.context.formStore[addInstanceSymbol](this.ids, {
        ids: this.ids,
        valueKey: this.props.valueKey,
        validateRule: [],
        isCorrectValue: true,
        errorMessage: '',
        disabled: false,    // 默认值为FALSE表明不是禁用状态
        isVisible: true,    // 默认值为TRUE表明是可见的
        colon: true,        // 默认值为TRUE表明label后是否有冒号
        validateStatus: 'success',
        ignoreDisplayError: this.props.ignoreDisplayError,
        ...info
      });
    }
  };

  processValue = (event: any) => {
    let newValue;
    // 如果用户有增加getValueFromEvent这个props，则完全由业务来控制取值操作。
    if (this.props.getValueFromEvent !== undefined) {
      newValue = this.props.getValueFromEvent(event);
    } else {
      if (!event || !event.target) {
        newValue = event;
      } else {
        if (event.target.type === 'checkbox') {
          newValue = event.target.checked;
        } else {
          newValue = event.target.value;
        }
      }
    }
    return newValue;
  };

  updateValue = (event: any) => {
    storeHelper.set(this.context.formStore, this.props.valueKey, this.processValue(event));
  };

  validateThisField = () => {
    this.context.formStore[getInstanceSymbol](this.ids).verifyThisField();
  };

  getNewProps = (disabled) => {
    const eventParam = {};
    if (this.props.trigger !== undefined &&
      this.props.validateTrigger !== undefined &&
      this.props.valuePropName !== undefined) {
      const trigger = this.props.trigger;
      const validateTrigger = this.props.validateTrigger;
      if (trigger === validateTrigger) {
        let customEvent = (event) => {};
        if (Object.keys(this.props.children.props).indexOf(trigger) >= 0) {
          customEvent = this.props.children.props[trigger];
        }
        eventParam[trigger] = (event) => {
          this.updateValue(event);
          this.validateThisField();
          customEvent(event);
        };
      } else {
        let customEvent1 = (event) => {};
        let customEvent2 = (event) => {};
        if (Object.keys(this.props.children.props).indexOf(trigger) >= 0) {
          customEvent1 = this.props.children.props[trigger];
        }
        if (Object.keys(this.props.children.props).indexOf(validateTrigger) >= 0) {
          customEvent2 = this.props.children.props[validateTrigger];
        }
        eventParam[trigger] = (event) => {
          this.updateValue(event);
          customEvent1(event);
        };
        eventParam[validateTrigger] = (event) => {
          this.validateThisField();
          customEvent2(event);
        };
      }
    } else {
      // 由于设置了defaultProps,,不会执行到这里。但是为了绕考Flow不讲defaultProps纳入计算，所以绕一下。
      throw new Error('this.props.trigger and this.props.validateTrigger 必须赋值。');
    }
    const valuePropsName: string = this.props.valuePropName ? this.props.valuePropName : 'value';
    return {
      ...eventParam,
      disabled,
      [valuePropsName]: storeHelper.get(this.context.formStore, this.props.valueKey),
    };
  };

  render() {
    const instance = this.context.formStore[InstanceListSymbol].get(this.ids);
    if (instance && instance.isVisible) {
      let isRequired = this.context.isRequired;
      if (this.props.hideRequiredMark) {
        isRequired = false;
      }
      return (
        <FormItem
          validateStatus={instance.validateStatus}
          help={instance.errorMessage}
          required={isRequired}
          label={this.props.label}
          hasFeedback={this.props.hasFeedback}
          colon={instance.colon}
          labelCol={this.props.labelCol}
          wrapperCol={this.props.wrapperCol}
        >
          <div id={this.ids}>
            {React.cloneElement(this.props.children, this.getNewProps(instance.disabled))}
          </div>
        </FormItem>
      );
    }
    return <span />;
  }

}

export default Connect(Field);

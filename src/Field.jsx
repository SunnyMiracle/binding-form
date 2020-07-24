// @flow
import * as React from 'react';
import {Form as AntForm} from 'antd';
import {reaction} from 'mobx';
import {observer} from 'mobx-react';
import _ from 'lodash';
import storeHelper from './lib/storeHelper';
import {mergeRules} from './lib/validate';
import {isBaseVerification} from './rules/basic';
import type {localRuleType, validateFunctionType} from './rules/basic';
import type {FormStoreDataType} from './createFormStore';
import {withContext, FieldContext} from './withContext';

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
  labelCol?: {},
  wrapperCol?: {},
  disabled?: boolean | (store: FormStoreDataType, valueKey: string) => boolean,
  isVisible?: boolean | (store: FormStoreDataType, valueKey: string) => boolean,
  colon?: boolean,
  hasFeedback?: boolean,
  hideRequiredMark?: boolean // 必填选项标志不再通过props传入，而是根据验证规则来推导，但是保留API可以允许不显示红色星标志。
};

export type StateTypes = {
  isCorrectValue: boolean,
  errorMessage?: string,
  validateStatus: 'warning' | 'error' | 'success' | 'validating',
  validateRule: Array<{
    uniqueKey: string,
    method: () => {
      isCorrectValue: boolean,
      errorMessage?: string
    }
  }>,
  isRequired: boolean, // 是否是必填项
  disabled: boolean,
  isVisible: boolean,
  colon: boolean
};

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

const FormItem = AntForm.Item;

// 一个使用 Field 的中间组件
function Toolbar(props) {
  return (
    <Field {...props}/>
  );
}

@observer
class Field extends React.Component<FieldPropTypes, StateTypes> {

  static contextType = FieldContext;
  static defaultProps = {
    trigger: 'onChange',
    validateTrigger: 'onBlur',
    valuePropName: 'value',
  };

  reactionInstance: () => mixed;

  constructor(props: FieldPropTypes, context: ContextType) {
    super(props);
    this.ids = _.uniqueId('base_frame_component');
    this.state = {
      validateRule: [],
      isCorrectValue: true,
      errorMessage: '',
      isRequired: false,  // 默认值为FALSE表明不是必填项
      disabled: false,    // 默认值为FALSE表明不是禁用状态
      isVisible: true,    // 默认值为TRUE表明是可见的
      colon: true,        // 默认值为TRUE表明label后是否有冒号
      validateStatus: 'success',
    };
  }

  UNSAFE_componentWillMount() { // eslint-disable-line
    this.mergeRuleAndAddInstance(this.props, this.context);
  }

  componentDidMount() {
    this.reactionInstance = reaction(
      () => {
        return {
          isVisible: this.getIsVisible(this.props, this.context),
          disabled: this.getDisableStatus(this.props, this.context),
        };
      },
      (data, thisReaction) => {
        this.setState({
          isVisible: data.isVisible,
          disabled: data.disabled,
        }, () => {
          this.addAndUpdateInstance();
        });
      }
    );
  }

  UNSAFE_componentWillReceiveProps(nextProps: FieldPropTypes, nextContext: ContextType) { // eslint-disable-line
    this.mergeRuleAndAddInstance(nextProps, nextContext);
  }
  UNSAFE_componentWillUnmount() { // eslint-disable-line
    this.context.formStore.deleteInstance(this.ids);
    this.reactionInstance(); // 清理定义的函数
  }

  ids: string;

  // 得出验证规则，以及是否有必填项的验证规则，同时更新InstanceList
  mergeRuleAndAddInstance = (props: FieldPropTypes, context: ContextType) => {
    const rules = mergeRules(context.rules, props.rules);
    let isRequired = this.state.isRequired;
    rules.forEach((ruleItem) => {
      if (isBaseVerification(ruleItem.uniqueKey) && ruleItem.uniqueKey.indexOf('required') > 0) {
        isRequired = true;
      }
    });
    this.setState({
      validateRule: rules,
      isRequired: this.getIsNeedRequiredMark(props, isRequired),
      disabled: this.getDisableStatus(props, context),
      isVisible: this.getIsVisible(props, context),
      colon: this.getColonStatus(props, context),
    }, () => {
      this.addAndUpdateInstance();
    });
  };

  // 初始化、更新Field实例的函数
  addAndUpdateInstance = () => {
    this.context.formStore.addInstance(this.ids, {
      valueKey: this.props.valueKey,
      validateRule: this.state.validateRule,
      updateFieldState: this.updateFieldState,
      isCorrectValue: this.state.isCorrectValue,
      errorMessage: this.state.errorMessage,
      validateStatus: this.state.validateStatus,
      isVisible: this.state.isVisible,
      disabled: this.state.disabled,
      ignoreDisplayError: this.props.ignoreDisplayError,
    });
  };

  updateFieldState = (state: {
    isCorrectValue: boolean,
    errorMessage?: string,
    validateStatus: 'warning' | 'error' | 'success' | 'validating',
  }): void => {
    this.setState({
      isCorrectValue: state.isCorrectValue,
      errorMessage: state.errorMessage,
      validateStatus: state.validateStatus,
    });
  };

  // 用于计算当前组件的禁用状态，通过context.disabled和props.disabled进行推导
  getDisableStatus = (props: FieldPropTypes, context: ContextType): boolean => {
    if (props.disabled !== undefined) {
      if (typeof props.disabled === 'function') {
        return props.disabled(context.formStore, props.valueKey);
      }
      return props.disabled;
    }
    if (context.disabled !== undefined) {
      if (typeof context.disabled === 'function') {
        return context.disabled(context.formStore);
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
  getIsVisible = (props: FieldPropTypes, context: ContextType): boolean => {
    if (props.isVisible !== undefined) {
      if (typeof props.isVisible === 'function') {
        return props.isVisible(context.formStore, props.valueKey);
      }
      return props.isVisible;
    }
    if (context.isVisible !== undefined) {
      if (typeof context.isVisible === 'function') {
        return context.isVisible(context.formStore);
      }
      return context.isVisible;
    }
    // 如果两层都没有设置，则默认定义为展示结果，返回TRUE
    return true;
  };

  // 用于计算最终hideRequiredMark的值，通过context.fieldSetHideRequiredMark, context.formHideRequiredMark, props.hideRequiredMark
  getIsNeedRequiredMark = (props: FieldPropTypes, isRequiredFromState: boolean): boolean => {
    if (props.hideRequiredMark !== undefined) { // 不是undefined，必定是布尔值，如果不是布尔值PropTypes自然会检测报错
      return !props.hideRequiredMark && isRequiredFromState;
    }
    if (this.context.fieldSetHideRequiredMark !== undefined) {
      return !this.context.fieldSetHideRequiredMark && isRequiredFromState;
    }
    if (this.context.formHideRequiredMark !== undefined) {
      return !this.context.formHideRequiredMark && isRequiredFromState;
    }
    // 如果这三层都是undefined，则直接返回isRequiredFromState 即 this.state.isRequired即可
    return isRequiredFromState;
  };

  // 用于计算label的布局格式，通过context.labelCol 合props.labelCol进行推导
  getLabelCol = () => {
    if (this.props.labelCol !== undefined) {
      return this.props.labelCol;
    }
    if (this.context.labelCol !== undefined) {
      return this.context.labelCol;
    }
    return undefined;
  };

  // 用于计算wrapperCol的布局格式，通过context.wrapperCol 合props.wrapperCol进行推导
  getWrapperCol = () => {
    if (this.props.wrapperCol !== undefined) {
      return this.props.wrapperCol;
    }
    if (this.context.wrapperCol !== undefined) {
      return this.context.wrapperCol;
    }
    return undefined;
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
    this.context.formStore.getInstance(this.ids).verifyThisField();
  };

  getNewProps = () => {
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
    const valuePropsName = this.props.valuePropName ? this.props.valuePropName : 'value';
    return {
      ...eventParam,
      disabled: this.state.disabled,
      // id: this.ids,
      [valuePropsName]: storeHelper.get(this.context.formStore, this.props.valueKey),
    };
  };
  render() {
    if (this.state.isVisible) {
      return (
        <FormItem
          validateStatus={this.state.validateStatus}
          help={this.state.errorMessage}
          required={this.state.isRequired}
          label={this.props.label}
          hasFeedback={this.props.hasFeedback}
          colon={this.state.colon}
          labelCol={this.getLabelCol()}
          wrapperCol={this.getWrapperCol()}
        >
          <div id={this.ids}>
            {React.cloneElement(this.props.children, this.getNewProps())}
          </div>
        </FormItem>
      );
    }
    return <span />;
  }

}

export default withContext(Toolbar);

// @flow
import * as React from 'react';
import {reaction} from 'mobx';
import {observer} from 'mobx-react';
import _ from 'lodash';
import storeHelper from './lib/storeHelper';
import {mergeRules} from './lib/validate';
import {isBaseVerification} from './rules/basic';
import type {localRuleType, validateFunctionType} from './rules/basic';
import type {FormStoreDataType} from './createFormStore';


export type FieldPropTypes = {
  children: React.Element<any>,
  valueKey: string,
  trigger?: string, // 组件获取值的时机
  validateTrigger?: string, // 组件进行数据验证的时机
  valuePropName?: string, // 子节点值的属性，比如Switch 的是'Checked' 默认值为value
  getValueFromEvent?: (Object) => Object, // 可以劫持默认获取组件值的时机方法内拿到的值，并转换成自己想要的格式
  ignoreDisplayError?: boolean,
  rules?: (localRuleType | validateFunctionType) | Array<localRuleType | validateFunctionType>, // 验证规则，可以指定多个或者单个验证规则，默认首要验证规则为第一个
  label?: string | React.Node,
  prefix?: string,
  disabled?: boolean | (store: FormStoreDataType, valueKey: string) => boolean,
  isVisible?: boolean | (store: FormStoreDataType, valueKey: string) => boolean,
  colon?: boolean,
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
  rules: (localRuleType | validateFunctionType) | Array<localRuleType | validateFunctionType>,
  disabled: boolean,
  isVisible: boolean,
  colon: boolean
};


@observer
export default class Field extends React.Component<FieldPropTypes, StateTypes> {

  static contextTypes = {
    formStore: React.PropTypes.shape({}).isRequired, // 从 Form 或 上一层 传入的 store 实例
    rules: React.PropTypes.oneOfType([
      React.PropTypes.oneOfType([
        React.PropTypes.shape({}),
        React.PropTypes.func
      ]),
      React.PropTypes.arrayOf(
        React.PropTypes.oneOfType([
          React.PropTypes.shape({}),
          React.PropTypes.func
        ])
      )
    ]), // 此部分从FieldSet传递下来，优先验证规则
    isVisible: React.PropTypes.bool,
    colon: React.PropTypes.bool,
    disabled: React.PropTypes.bool // 从FiledSet部分传递下来，说明是否只读，优先级与this.props.disabled相同，只要其中一项为TRUE，则都是只读状态。
  };

  static defaultProps = {
    trigger: 'onChange',
    validateTrigger: 'onBlur',
    valuePropName: 'value',
    prefix: 'bindingForm'
  };

  constructor(props: FieldPropTypes) {
    super(props);
    this.ids = _.uniqueId('base_frame_component');
    this.state = {
      validateRule: [],
      isCorrectValue: true,
      errorMessage: '',
      isRequired: false, // 默认值为FALSE表明不是必填项
      disabled: false, // 默认值为FALSE表明不是禁用状态
      isVisible: true, // 默认值为TRUE表明是可见的
      colon: true, // 默认值为TRUE表明label后是否有冒号
      validateStatus: 'success'
    };
  }

  componentWillMount() {
    this.mergeRuleAndAddInstance(this.props, this.context);
  }

  componentDidMount() {
    reaction(
      () => {
        return {
          isVisible: this.getIsVisible(this.props, this.context),
          disabled: this.getDisableStatus(this.props, this.context)
        };
      },
      (data, thisReaction) => {
        this.setState({
          isVisible: data.isVisible,
          disabled: data.disabled
        }, () => {
          this.addAndUpdateInstance();
        });
      }
    );
  }

  componentWillReceiveProps(nextProps: FieldPropTypes, nextContext: ContextType) {
    this.mergeRuleAndAddInstance(nextProps, nextContext);
  }

  componentWillUnmount() {
    this.context.formStore.deleteInstance(this.ids);
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
      isRequired,
      disabled: this.getDisableStatus(props, context),
      isVisible: this.getIsVisible(props, context),
      colon: this.getColonStatus(props, context)
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
      ignoreDisplayError: this.props.ignoreDisplayError
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
      validateStatus: state.validateStatus
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
        let customEvent = (event) => {
        };
        if (Object.keys(this.props.children.props).indexOf(trigger) >= 0) {
          customEvent = this.props.children.props[trigger];
        }
        eventParam[trigger] = (event) => {
          this.updateValue(event);
          this.validateThisField();
          customEvent(event);
        };
      } else {
        let customEvent1 = (event) => {
        };
        let customEvent2 = (event) => {
        };
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
      [valuePropsName]: storeHelper.get(this.context.formStore, this.props.valueKey)
    };
  };

  render() {
    let correctClassStatus = '';
    let validateClassStatus = '';
    let isRequiredClassStatus = '';
    if (this.state.isCorrectValue) {
      correctClassStatus = 'correct';
    } else {
      correctClassStatus = 'failed';
    }
    if (this.state.isRequired) {
      isRequiredClassStatus = 'required';
    } else {
      isRequiredClassStatus = 'unRequired';
    }
    switch (this.state.validateStatus) {
      case 'success': {
        validateClassStatus = 'successValidate';
        break;
      }
      case 'validating': {
        validateClassStatus = 'validatingValidate';
        break;
      }
      case 'error': {
        validateClassStatus = 'errorValidate';
        break;
      }
      case 'warning': {
        validateClassStatus = 'warningValidate';
        break;
      }
      default: {
        validateClassStatus = 'successValidate';
        break;
      }
    }
    if (this.props.prefix) {
      correctClassStatus = `${this.props.prefix}-${correctClassStatus}`;
      validateClassStatus = `${this.props.prefix}-${validateClassStatus}`;
      isRequiredClassStatus = `${this.props.prefix}-${isRequiredClassStatus}`;
    }
    let label = '';
    if (this.props.label) {
      label = this.props.label;
      if (this.props.colon) {
        label = <span>{this.props.label}:</span>;
      }
    }
    if (this.state.isVisible) {
      return (
        <div
          className={`${correctClassStatus} ${validateClassStatus} ${isRequiredClassStatus}`}
        >
          <div id={this.ids}>
            <span className="label">{label}</span>
            {React.cloneElement(this.props.children, {...this.getNewProps()})}
            {
              this.state.isCorrectValue ? '' :
              <span className="errorMessageStyle">{this.state.errorMessage}</span>
            }
          </div>
        </div>
      );
    }
    return <span/>;
  }

}

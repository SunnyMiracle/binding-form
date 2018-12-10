// @flow
import * as React from 'react';
import {observer} from 'mobx-react';
import type {FormStoreDataType, InstanceType} from './createFormStore';


type FormPropTypes = {
  formStore: FormStoreDataType,
  children: any,
  layout?: 'inline' | 'vertical' | 'horizontal',
  prefix?: string,
  onSubmit: (Promise<{
    errorList: Array<InstanceType>,
    state: {}
  }>) => void
}

@observer
export default class Form extends React.Component<FormPropTypes> {

  static childContextTypes = {
    formStore: React.PropTypes.shape({}).isRequired,
  };

  static defaultProps = {
    prefix: 'bindingForm',
    layout: 'inline'
  };

  getChildContext() {
    return {
      formStore: this.props.formStore,
    };
  }

  handleSubmit = (event: Event) => {
    event.preventDefault();
    if (this.props.onSubmit) {
      if (typeof this.props.formStore.validateFieldsAndScroll === 'function') {
        this.props.onSubmit(this.props.formStore.validateFieldsAndScroll());
      }
    }
  };

  render() {
    let layoutStyle = '';
    switch (this.props.layout) {
      case 'inline': {
        layoutStyle = 'inlineStyle';
        break;
      }
      case 'vertical': {
        layoutStyle = 'verticalStyle';
        break;
      }
      case 'horizontal': {
        layoutStyle = 'horizontalStyle';
        break;
      }
      default: {
        layoutStyle = 'inlineStyle';
        break;
      }
    }
    let className = layoutStyle;
    if (this.props.prefix) {
      className = `${this.props.prefix}-${layoutStyle}`;
    }
    return (
      <form className={className} onSubmit={this.handleSubmit}>
        {this.props.children}
      </form>
    );
  }

}

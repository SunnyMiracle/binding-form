// @flow
import * as React from 'react';
import {Form as AntForm} from 'antd';
import {observer} from 'mobx-react';
import type {FormStoreDataType, InstanceType} from './createFormStore';


type FormPropTypes = {
  formStore: FormStoreDataType,
  children: any,
  layout?: 'inline' | 'vertical' | 'horizontal',
  hideRequiredMark?: boolean,
  onSubmit: (Promise<{
    errorList: Array<InstanceType>,
    state: {}
  }>) => void
}


// 创建Context组件
export const FormContext = React.createContext();

@observer
export default class Form extends React.Component<FormPropTypes> {

  handleSubmit = (event: Event) => {
    event.preventDefault();
    if (this.props.onSubmit) {
      if (typeof this.props.formStore.validateFieldsAndScroll === 'function') {
        this.props.onSubmit(this.props.formStore.validateFieldsAndScroll());
      }
    }
  };

  render() {
    return (
      <FormContext.Provider
        value={{
          formStore: this.props.formStore,
          formHideRequiredMark: this.props.hideRequiredMark,
        }}
      >
        <AntForm
          layout={this.props.layout}
          onSubmit={this.handleSubmit}
          hideRequiredMark={this.props.hideRequiredMark}
        >
          {this.props.children}
        </AntForm>
      </FormContext.Provider>
    );
  }

}

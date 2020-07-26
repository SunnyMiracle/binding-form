// @flow
import * as React from 'react';
import {Form as AntForm} from 'antd';
import type {FormStoreDataType} from './createFormStore';


type FormPropTypes = {
  formStore: FormStoreDataType,
  children: any,
  layout?: 'inline' | 'vertical' | 'horizontal',
  hideRequiredMark?: boolean,
}


// 创建Context组件
export const FormContext = React.createContext();

export default class Form extends React.Component<FormPropTypes> {

  render() {
    return (
      <FormContext.Provider
        value={{
          formStore: this.props.formStore,
          formHideRequiredMark: this.props.hideRequiredMark,
          layout: this.props.layout,
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

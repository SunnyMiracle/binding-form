import * as React from 'react';
import { observer } from 'mobx-react';
import {Field, FieldSet, baseRule, storeHelper} from '../../index.jsx';
import {Input, Select, DatePicker} from 'antd';
import Title from './title';
import type {standardResultType} from "../../lib/standardResult";

@observer
export default class Info extends React.Component {

  // 模拟异步校验
  checkIdNumber = (value, store, standardStatus: standardResultType) => {
    console.log(value, store, standardStatus);
    return new Promise((resolve) => {
      setTimeout(() => { resolve(); }, 1000);
    }).then(() => {
      return standardStatus.warning('warning');
    })
  };

  render() {
    const valueKeyPrefix = this.props.valueKeyPrefix;
    const idNumberIsVisible = (store, valueKey) => {
      return storeHelper.get(store, `${valueKeyPrefix}.id_type`) === 'sfz';
    };
    return (
      <div style={{marginTop: '100px'}}>
        <Title formStore={this.props.formStore} valueKey={`${valueKeyPrefix}.firstName`}/>-
        <Title formStore={this.props.formStore} valueKey={`${valueKeyPrefix}.lastName`}/>
        <FieldSet
          rules={baseRule.basic.required('必填项(FieldSet-1)', {})}
          colon={false}
          labelCol={{ span: 3, offset: 0 }}
        >
          <Field label="姓" valueKey={`${valueKeyPrefix}.firstName`}>
            <Input placeholder="拼音或英文" onBlur={() => {console.log('onBlur')}}/>
          </Field>
          <Field label="名" valueKey={`${valueKeyPrefix}.lastName`}>
            <Input placeholder="拼音或英文" onBlur={() => {console.log('onBlur')}}/>
          </Field>
        </FieldSet>
        <FieldSet
          rules={baseRule.basic.required('必填项(FieldSet-2)', { validateStatus: 'warning' })}
          labelCol={{ span: 5, offset: 0 }}
        >
          <Field label="出生日期" valueKey={`${valueKeyPrefix}.birth`} validateTrigger="onChange">
            <DatePicker/>
          </Field>
          <Field label="证件类型" valueKey={`${valueKeyPrefix}.id_type`}>
            <Select>
              <Select.Option value="sfz">sfz</Select.Option>
              <Select.Option value="hz">hz</Select.Option>
            </Select>
          </Field>
          <Field label="证件号码" valueKey={`${valueKeyPrefix}.id_number`} rules={[this.checkIdNumber]} hasFeedback={true} isVisible={idNumberIsVisible}>
            <Input/>
          </Field>
          <Field label="证件过期日期" valueKey={`${valueKeyPrefix}.birth`} disabled={idNumberIsVisible} validateTrigger="onChange">
            <DatePicker/>
          </Field>
        </FieldSet>
      </div>
    );
  }

}

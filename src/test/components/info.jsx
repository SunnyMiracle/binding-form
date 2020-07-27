import * as React from 'react';
import { observer } from 'mobx-react';
import BindingForm from '../../index.jsx';
import {Input, Select, DatePicker} from 'antd';
import Title from './title';
import storeHelper from "../../lib/storeHelper";

const Field = BindingForm.Field;
const FieldSet = BindingForm.FieldSet;
const baseRule = BindingForm.baseRule;


@observer
export default class Info extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      label: 'xing',
      labelCol: { span: 2, offset: 4 },
      isVisible: false,
    }
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({
        label: '姓',
        isVisible: true,
      });
    }, 1000);
  }

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
        >
          <Field
            label={this.state.label}
            valueKey={`${valueKeyPrefix}.firstName`}
            colon={this.state.isVisible}
            hideRequiredMark={true}
            rules={[baseRule.basic.required('必填项。', {validateStatus: 'warning'})]}
          >
            <Input placeholder="拼音或英文" onBlur={() => {console.log('onBlur')}}/>
          </Field>
          <Field
            label="名"
            valueKey={`${valueKeyPrefix}.lastName`}
            rules={[baseRule.basic.required('必填项。', {validateStatus: 'warning'})]}
          >
            <Input placeholder="拼音或英文" onBlur={() => {console.log('onBlur')}}/>
          </Field>
        </FieldSet>
        <FieldSet
          rules={baseRule.basic.required('必填项(FieldSet-2)', {})}
        >
          <Field
            label="出生日期"
            valueKey={`${valueKeyPrefix}.birth`}
            validateTrigger="onChange"
          >
            <DatePicker/>
          </Field>
          <Field label="证件类型" valueKey={`${valueKeyPrefix}.id_type`}>
            <Select>
              <Select.Option value="sfz">sfz</Select.Option>
              <Select.Option value="hz">hz</Select.Option>
            </Select>
          </Field>
          <Field
            label="证件号码"
            valueKey={`${valueKeyPrefix}.id_number`}
            rules={
              [
                baseRule.basic.verifyNumber('请输入数字！', {}),
                (value, store, standardStatus) => {
                  return new Promise((resolve) => {
                    setTimeout(() => { resolve(); }, 1000);
                  }).then(() => {
                    return standardStatus.error('字符串错误')
                  })
                }
              ]
            }
            isVisible={idNumberIsVisible}
          >
            <Input/>
          </Field>
          <Field
            label="证件过期日期"
            valueKey={`${valueKeyPrefix}.idExpiryDate`}
            isVisible={idNumberIsVisible}
            validateTrigger="onChange"
          >
            <DatePicker/>
          </Field>
        </FieldSet>
      </div>
    );
  }

}

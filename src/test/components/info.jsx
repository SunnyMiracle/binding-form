import * as React from 'react';
import BindingForm from '../../index.jsx';
import {observer} from "mobx-react/index";
import Title from './title';
import storeHelper from "../../lib/storeHelper";

const Field = BindingForm.Field;
const FieldSet = BindingForm.FieldSet;
const baseRule = BindingForm.baseRule;
// const storeHelper = BindingForm.storeHelper;


// @observer
export default class Info extends React.Component {

  static propTypes = {
    valueKeyPrefix: React.PropTypes.string.isRequired,
    data: React.PropTypes.shape({}).isRequired,
    formStore: React.PropTypes.shape({}).isRequired
  };

  componentDidMount() {
    this.props.data.plus();
  }

  render() {
    const valueKeyPrefix = this.props.valueKeyPrefix;
    return (
      <div style={{marginTop: '100px'}}>
        <Title formStore={this.props.formStore} valueKey={`${valueKeyPrefix}.firstName`}/>-
        <Title formStore={this.props.formStore} valueKey={`${valueKeyPrefix}.lastName`}/>
        <FieldSet
          rules={baseRule.basic.required('must', {})}
        >
          <Field
            label="姓"
            valueKey={`${valueKeyPrefix}.firstName`}
            required={true}
            rules={[baseRule.basic.required('必填项。', {validateStatus: 'warning'})]}
          >
            <input placeholder="拼音或英文姓，例如，Ouyang" onBlur={() => {console.log('onBlur')}}/>
          </Field>
          <Field
            label="名"
            valueKey={`${valueKeyPrefix}.lastName`}
            required={true}
            rules={[baseRule.basic.required('必填项。', {validateStatus: 'warning'})]}
          >
            <input placeholder="拼音或英文名，例如，Xiaobai" onBlur={() => {console.log('onBlur')}}/>
          </Field>
        </FieldSet>
        <FieldSet
          rules={baseRule.basic.required('must', {})}
        >
          <Field
            label="证件号码"
            valueKey={`${valueKeyPrefix}.id_number`}
            required={true}
            rules={[baseRule.basic.verifyNumber('请输入数字！', {})]}
          >
            <input/>
          </Field>
        </FieldSet>
        <button onClick={() => { this.props.data.plus(); }}>Plus</button>
        <input value={this.props.data.firstName} onChange={(event) => { this.props.data.firstName = event.target.value; }}/>
      </div>
    );
  }

}

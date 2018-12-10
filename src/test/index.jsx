// @flow
import * as React from 'react';
import {action} from 'mobx';
import {observer} from "mobx-react";
import moment from 'moment';
import BindingForm from '../index.jsx';
import Info from './components/info';

const Form = BindingForm.Form;
const Field = BindingForm.Field;
const FieldSet = BindingForm.FieldSet;
const baseRule = BindingForm.baseRule;
// const storeHelper = BindingForm.storeHelper;
const createFormStore = BindingForm.createFormStore;

type PropType = {}

const data = {
  rawData: [{
    firstName: 'kive',
    lastName: 'xiaobai',
    gender: 'male',
    birth: moment('2020-02-20'),
    nationality: 'cn',
    id_type: '',
    id_number: '',
    idExpiryDate: moment('2020-02-20'),
    plus: action(function() {
      this.firstName = this.firstName + '_test';
    })
  }],
  updatePassenger: action(function (data, index) {
    this.rawData[index] = {
      ...this.rawData[index],
      ...data
    };
  }),
  addPassenger: action(function (data) {
    this.rawData.push({
      ...data,
      plus: action(function() {
        this.firstName = this.firstName + '_test';
      })
    });
  })
};


@observer
export default class SimpleTest extends React.Component<PropType, StateType> {

  constructor() {
    super();
    this.state = {
      loading: true
    };
    this.formStore = createFormStore(data);
  }

  componentDidMount() {
    this.fetchInitData().then((res) => {
      this.formStore.updatePassenger(res, 0);
    });
    console.log(this.formStore);
    console.log(this.formStore.getInstance());
  }

  getNewPassenger = () => {
    this.fetchPassengerInfo(this.formStore.rawData.length).then((passengerInfo) => {
      this.fetchPassengerCode(passengerInfo.nationality).then((passengerCode) => {
        this.formStore.addPassenger({
          ...passengerInfo,
          id_number: passengerCode
        });
      });
    });
  }

  submitFunction = (validation) => {
    validation.then((result) => {
      console.log(result);
    })
  };

  clearFunction = () => {
    this.formStore.resetFields();
  };

  /**
   * 关于级联效果的说明：
   * 具体例子见用户名的输入项。
   * 1，isVisible 上赋值为直接从FormStore上取的值，
   * 2, disabled 采用回调函数的形式赋值。
   * 这两种写法都能实现级联的效果。
   * 第一种，是因为当前test 页面 有设置@observer装饰器（实际上是用autorun包装了render函数），当第一种写法：this.formStore.isVisible实际上就是
   * 在autorun里边订阅，观察了此属性，当对应值有变化，会强制forceRender，从而实现了级联效果。但是这时会将整个Form进行刷新，内部节点众多时会有性能问题。
   * 第二种，写法，在对应的Field组件内容对该属性订阅，观察，所以只会forceRender对应的Field组件。
   *
   * 目前版本中两种情况只能保留。后续待优化。
   *
   * 建议使用第二种形式进行级联操作。
   */

  renderData = () => {
    return this.formStore.rawData.map((item, index) => {
      return (
        <Info
          data={item}
          formStore={this.formStore}
          valueKeyPrefix={`rawData.${index}`}
          key={index}
        />
      );
    });
  };

  // 模拟接口，获取默认数据
  fetchInitData = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          firstName: 'jschen',
          lastName: 'lu',
          gender: 'male',
          birth: moment(),
          nationality: 'cn',
          id_type: 'passport',
          id_number: '130622199203125833',
          idExpiryDate: moment().add(1, 'year'),
        });
        this.setState({
          loading: false
        });
      }, 1000);
    })
  }

  // 模拟接口获取人的相关信息
  fetchPassengerInfo = (key) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          firstName: `firstName-${key}`,
          lastName: `lastName-${key}`,
          gender: 'male',
          birth: moment().add(key, 'day'),
          nationality: 'cn',
          id_type: '',
          id_number: '',
          idExpiryDate: moment('2020-02-20')
        })
      }, 1000);
    });
  }

  // 模拟去获取对应的证件号
  fetchPassengerCode = (code) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(`${code} + 12345678`);
      }, 1000);
    })
  }


  render() {
    return (
      <Form
        formStore={this.formStore}
        hideRequiredMark={false}
        layout="vertical"
        onSubmit={this.submitFunction}
      >
        <div>
          {this.renderData()}
          <button onClick={() => { this.getNewPassenger(); }}>Add</button>
        </div>
        
        <button type="submit">提交</button>
        <button onClick={this.clearFunction}>清空</button>
      </Form>
    );
  }

}

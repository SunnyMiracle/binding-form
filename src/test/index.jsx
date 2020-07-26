// @flow
import * as React from 'react';
import {observer} from "mobx-react";
import moment from 'moment';
import { Form, createFormStore } from '../index.jsx';
import Info from './components/info';
import {Button} from "antd";

type PropType = {}

// {
//   firstName: '',
//   lastName: '',
//   gender: 'male',
//   birth: null,
//   nationality: 'cn',
//   id_type: 'sfz', // hz
//   id_number: '',
//   idExpiryDate: null,
// }
const data = {
  rawData: [],
  updatePassenger: function (data, index) {
    this.rawData[index] = {
      ...this.rawData[index],
      ...data
    };
  },
  addPassenger: function (data) {
    this.rawData.push({
      ...data,
    });
  }
};


@observer
export default class SimpleTest extends React.Component<PropType, StateType> {

  constructor() {
    super();
    this.state = {
      loading: true
    };
    [this.formStore, this.formSubmit] = createFormStore(data);
  }

  componentDidMount() {
    this.fetchInitData().then((res) => {
      this.formStore.updatePassenger(res, 0);
    });
  }

  getNewPassenger = () => {
    this.fetchPassengerInfo(this.formStore.rawData.length).then((passengerInfo) => {
      this.fetchPassengerCode().then((passengerCode) => {
        this.formStore.addPassenger({
          ...passengerInfo,
          id_number: passengerCode
        });
      });
    });
  }

  submitFunction = () => {
    console.log(this.formStore);
    this.formSubmit().then((data) => {
      console.log(data);
    })
  };

  clearFunction = () => {
    this.formStore.rawData = [];
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
      resolve({
        firstName: 'qian',
        lastName: 'lu',
        gender: 'male',
        birth: moment(),
        nationality: 'cn',
        id_type: 'sfz',
        id_number: '130622199203125833',
        idExpiryDate: moment().add(1, 'year'),
      });
      this.setState({
        loading: false
      });
    })
  }

  // 模拟接口获取人的相关信息
  fetchPassengerInfo = (key) => {
    return new Promise((resolve, reject) => {
      resolve({
        firstName: `lucas`,
        lastName: `ben`,
        gender: 'female',
        birth: moment().add(key, 'day'),
        nationality: 'cn',
        id_type: 'hz',
        id_number: '',
        idExpiryDate: moment('2020-02-20')
      })
    });
  }

  // 模拟去获取对应的证件号
  fetchPassengerCode = () => {
    return new Promise((resolve, reject) => {
      resolve('130622199203125833');
    })
  };

  render() {
    return (
      <Form
        formStore={this.formStore}
        hideRequiredMark={false}
        layout="horizontal"
        onSubmit={this.submitFunction}
      >
        <div>
          {this.renderData()}
          <Button onClick={() => { this.getNewPassenger(); }}>Add</Button>
        </div>
        <Button type="submit" onClick={this.submitFunction}>提交</Button>
        <Button onClick={this.clearFunction}>清空</Button>
      </Form>
    );
  }

}

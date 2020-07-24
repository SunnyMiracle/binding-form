import React from 'react';
import {observer} from "mobx-react/index";
import BindingForm from '../../index.jsx';

const storeHelper = BindingForm.storeHelper;


@observer
export default class Title extends React.Component {

  render() {
    return (
      <h1 style={{display: 'inline-block'}}>{storeHelper.get(this.props.formStore, this.props.valueKey)}</h1>
    );
  }

}

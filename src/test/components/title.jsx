import React from 'react';
import {observer} from "mobx-react";
import {storeHelper} from '../../index.jsx';

@observer
export default class Title extends React.Component {

  render() {
    return (
      <h1 style={{display: 'inline-block'}}>{storeHelper.get(this.props.formStore, this.props.valueKey)}</h1>
    );
  }

}

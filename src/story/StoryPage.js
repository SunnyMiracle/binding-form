import React from 'react';
import PropTypes from 'prop-types';
import Test from '../test';
import s from './StoryPage.module.less';
// import ContextTest from "./contextTest";
// import Item from "./item";


export default class StoryPage extends React.Component {

  static propTypes = {
    locale: PropTypes.string.isRequired,
    localeOptions: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    onLocaleChange: PropTypes.func.isRequired,
  };

  toolbarContainer = undefined;

  handleChange = (nextLocale) => {
    this.props.onLocaleChange(nextLocale);
  };

  render() {
    return (
      <div className={s.layout}>
        <div className={s.content}>
          <Test/>
        </div>
      </div>
    );
  }

}

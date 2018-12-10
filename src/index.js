import React from 'react';
import ReactDOM from 'react-dom';
import StoryPage from './story/StoryPage';


/*
 *
 * !!!!!!!!!!!!!!!!!!!!!
 * !!!!   请勿修改   !!!!
 * !!!!!!!!!!!!!!!!!!!!!
 *
 *
 * 仅本地开发时使用
 * 实际作为npm包开发时，公开的是 lib 下的组件
 */


function getLocaleFromSessionStorage() {
  return window.sessionStorage.getItem('storyPageLocale');
}

function setLocaleToSessionStorage(locale) {
  window.sessionStorage.setItem('storyPageLocale', locale);
}

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      localeOptions: ['en', 'zh'],
      locale: getLocaleFromSessionStorage() || 'zh',
    };
  }

  onLocaleChange = (nextLocale) => {
    setLocaleToSessionStorage(nextLocale);
    // 不要求支持动态切换语言
    window.location.reload();
  };

  render() {
    return (
      <StoryPage
        locale={this.state.locale}
        localeOptions={this.state.localeOptions}
        onLocaleChange={this.onLocaleChange}
      />
    );
  }

}

ReactDOM.render(<App/>, document.getElementById('root'));

import * as React from 'react';

export const TestContext = React.createContext();

const value = {
  obj: {
    name: 'name'
  }
}

class ContextTest extends React.Component {
  componentDidMount() {
    setTimeout(() => {
      value.obj.name = 'new name';
    }, 1000);
  }

  render() {
    return (
      <TestContext.Provider value={value}>
        {this.props.children}
      </TestContext.Provider>
    )
  }

}

export default ContextTest;

import * as React from 'react';
import {FormContext} from './Form';
import {FieldSetContext} from './FieldSet';

export const FieldContext = React.createContext();

export const withContext = (InnerComponent) => {
  return class extends React.Component {

    render() {
      return (
        <FormContext.Consumer>
          {formContextData => (
            <FieldSetContext.Consumer>
              {(fieldSetContextData) => {
                const data = {
                  ...formContextData,
                  ...fieldSetContextData,
                };
                return (
                  <FieldContext.Provider value={data}>
                    <InnerComponent {...this.props}/>
                  </FieldContext.Provider>
                );
              }}
            </FieldSetContext.Consumer>
          )}
        </FormContext.Consumer>
      );
    }

  };
};

export default withContext;


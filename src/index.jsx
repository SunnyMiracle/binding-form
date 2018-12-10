// @flow
import Form from './Form';
import FieldSet from './FieldSet';
import Field from './Field';
import baseRule from './rules';
import storeHelper from './lib/storeHelper';
import createFormStore from './createFormStore';

const BindingForm = {
  Form,
  Field,
  FieldSet,
  baseRule,
  storeHelper,
  createFormStore
};

export {default as createFormStore} from './createFormStore';
export {default as baseRule} from './rules';
export {default as storeHelper} from './lib/storeHelper';
export {default as FieldSet} from './FieldSet';
export {default as Field} from  './Field';
export {default as Form} from './Form';

export default BindingForm;


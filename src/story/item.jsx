import * as React from "react";
import { TestContext } from './contextTest';

class Item extends React.Component {
  render() {
    console.log(TestContext, this.context)
    return (
      <div>{this.context.obj.name}</div>
    )
  }
}
Item.contextType = TestContext;

export default Item;

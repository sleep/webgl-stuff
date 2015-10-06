import React from "react";
import literalify from "./literatify.js";

export default React.createClass({
  render() {
    let content = [
      `
# Computer Graphics
This is Sean Lee's page for Computer Graphics...

This is a counter:
      `,
      React.createElement(require("./Counter")),
      `
Look at it count!

Let me test some markdown...

List
- foo
- bar
- foobar
       `
    ];
    return (
      <div>
        {content.map(literalify)}
      </div>
    );
  }
});

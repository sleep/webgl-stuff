import React from "react";
import SuperLiterate from "./SuperLiterate.jsx";

export default React.createClass({
  render() {
    let content = [
      `
Some WebGL experiments.
Code on [GitHub](https://github.com/sleep/graphics).
Built with [react-literate](https://github.com/sleep/react-literate).
       `,
    ];
    return (
      <SuperLiterate>
        {content}
      </SuperLiterate>
    )
  }
})

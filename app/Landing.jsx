import React from "react";
import SuperLiterate from "./SuperLiterate.jsx";

export default React.createClass({
  render() {
    let content = [
      `
    This is Sean Lee's page
    for Computer Graphics...
       `,
    ];
    return (
      <SuperLiterate>
        {content}
      </SuperLiterate>
    );
  }
});

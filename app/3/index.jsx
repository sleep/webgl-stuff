import React, {PropTypes} from "react";
import SuperLiterate from "../SuperLiterate";

export default React.createClass({
  render() {
    let content = [
      `
# Procedural textures

...
`,
    ];
    return (
      <SuperLiterate>
        {content}
      </SuperLiterate>
    );
  }
})

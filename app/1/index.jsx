import React, {PropTypes} from "react";
import SuperLiterate from "../SuperLiterate";

export default React.createClass({
  render() {
    let content = [
      `
# Basic Shading
## Lambertian shading
`,
      React.createElement(require("./Program1.jsx")),
      `

## emergent self-similarity via aliasing

`,
      React.createElement(require("./Program2.jsx")),
      `

## full rotation in a sphere

Here we map mouse position to all possible rotations of the sphere.

To get full range of rotations, use inverse mercator projection to map square to sphere.


*aliasing death star*

`,
      React.createElement(require("./Program3.jsx")),
      `
ooh  whaddabout this
`,
      React.createElement(require("./Program4.jsx")),
    ];
    return (
      <SuperLiterate>
        {content}
      </SuperLiterate>
    );
  }
});

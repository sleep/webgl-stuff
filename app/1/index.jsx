import React, {PropTypes} from "react";
import SuperLiterate from "../SuperLiterate";

export default React.createClass({
  render() {
    let content = [
      `
# Intro to Shaders
yo what up

## Lambertian shading
`,
      React.createElement(require("./Program1.jsx")),
      `

whoa dude look at it shade...

## emergent self-similarity in aliasing

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
      <div>
        <h1>YO!!</h1>
      <SuperLiterate>
        {content}
      </SuperLiterate>
      </div>
    );
  }
})

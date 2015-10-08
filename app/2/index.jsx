import React, {PropTypes} from "react";
import SuperLiterate from "../SuperLiterate";

export default React.createClass({
  render() {
    let content = [
      `
# Ray Tracing

## Ray tracing with simple diffuse lighting:
`,
      React.createElement(require("./Program1.jsx")),
      `
## Multiple light sources:
Red light vector: [-1., -1., -1.];
Green light vector: [1., -1., -1.];
Blue light vector: uCursor mapped to a sphere;
`,
      React.createElement(require("./Program2.jsx")),
      `
## Multiple spheres:

Given a pixel on the image plane, shade it with respect to the closet sphere, i.e. the sphere with minimum t.
`,
      React.createElement(require("./Program3.jsx")),
    ];
    return (
      <SuperLiterate>
        {content}
      </SuperLiterate>
    );
  }
})

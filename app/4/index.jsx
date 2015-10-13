import React, {PropTypes} from "react";
import SuperLiterate from "../SuperLiterate";

export default React.createClass({
  render() {
    let content = [
      `
# More Ray Tracing

## Phong model for specular reflectance:

\`(ambient) + (diffuse Lambert reflectance) + (Phong specular reflectance)\`

         `,
      React.createElement(require("./Program1.jsx")),
      `
## Blinn-Phong model for specular reflectance:

\`(ambient) + (diffuse Lambert reflectance) + (Blinn-Phong specular reflectance)\`

         `,
      React.createElement(require("./Program2.jsx")),
      `
## Shadows
        `,
      React.createElement(require("./Program3.jsx")),
      `
## Add a plane
        `,
      React.createElement(require("./Program4.jsx")),
      `
## Boolean intersection

         `,
      React.createElement(require("./Program5.jsx")),
      `
## Reflection

`,
      React.createElement(require("./Program6.jsx")),
      `
## Classic Checkered floor

`,
      React.createElement(require("./Program7.jsx")),
      `
## Opacity + Reflection
A non-recursive "recursive" ray tracer with either reflection xor transmission is simple to implement iteratively, with O(1) memory. This is because the recursion happens only once per call: at the tail. A photon in is a photon out. There is no need for a stack as the colors mix linearly.

However, doing both reflection and transmission means two points of recursion per call, as we have to mix the fraction of photons going into the object, and the fraction of photons going out. Now we need a data structure to keep track of photon C, where photon A -> (B, C) and we choose to first compute B. Because of the multiplicative branching factor, the computation grows exponentially relative to the amount of levels.

The following solution uses an array, which uses O(2^n) memory, where n is maximum depth of recursion. The performance complexity is probably even worse; the code is so slow because I shimmy in a O(n) workaround for dynamic array indexing. OpenGL ES allows only constants, loop indicies, and combinations thereof for array indexing, so I simply loop until my loop index equals my variable, and break as soon as I'm done...


Alas, tis super slow... but works!
And I'm only recursing 3 levels deep...
`,
      React.createElement(require("./Program8.jsx")),
      `
## Opacity + Reflection, take 2
This time I'm going to stick with a single point of recursion, at the tail, and stochastically sample a light path.

The complete solution would be to repeat this computation through all 2^(n-1) permutations of lights paths, memoize each computation along the way, and then mix the colors in order. But I have better things to do than that.

Stochastic sampling allows for graceful degradation.

      `,
      React.createElement(require("./Program9.jsx")),
      `
## TODO
- make darker as t gets larger
`
    ];
    return (
      <SuperLiterate>
        {content}
      </SuperLiterate>
    );
  }
})

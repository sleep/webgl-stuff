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
A non-recursive "recursive" ray tracer with either just reflection or just transmission is simple to implement iteratively. This is because the recursion happens only once per call: at the tail. A photon in is a photon out. There is no need for a stack as the colors mix linearly, and so the memory requirements are O(1).

However, implementing both reflection and transmission means two points of recursion per call, as now each photon in is at maximum two photons out. Now we need a data structure to keep track of unexplored nodes in the ray tree. Because of the multiplicative branching factor, the computation grows exponentially relative to the amount of levels.

The following solution uses a heap implemented in an array, which uses O(2^n) memory, where n is the number of levels to fork photons. The code is so slow because I shimmy in a O(n) workaround for dynamic array indexing. OpenGL ES allows only constants, loop indicies, and combinations thereof for array indexing, so I emulate variable array indexing simply by looping until my loop index equals my variable and then breaking.


Alas, tis super slow... but works!
And I'm only recursing 3 levels deep...
`,
      React.createElement(require("./Program8.jsx")),
      `
## Opacity + Reflection, take 2
This time I'm going to stick with a single point of recursion, at the tail, and stochastically sample a light path.

The complete solution would be to repeat this computation through all 2^(n-1) permutations of lights paths, perhaps memoize each computation along the way, and then mix the colors in order. But my computer is too slow.

Stochastic sampling allows for graceful degradation.

      `,
      React.createElement(require("./Program9.jsx")),
      `
## Cool Thang
- back to reflectance only, no transmission
- Rays now get darker when they are further
- Light is now exaggeratedly polarized, with the phase determined by the time taken by the photon.
`,
      React.createElement(require("./Program10.jsx")),
      `
## Refraction
- added rotozooming
      `,
      React.createElement(require("./Program11.jsx")),
      `
## Refraction + reflection + rotozooming + cool thang phase beams
      `,
      React.createElement(require("./Program12.jsx")),
    ];
    return (
      <SuperLiterate>
        {content}
      </SuperLiterate>
    );
  }
})

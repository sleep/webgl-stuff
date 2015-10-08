

import React, {PropTypes} from "react";
import Program from "../Program";


let vs = `
attribute vec3 aPosition;
varying vec3 vPosition;

void main() {
  gl_Position = vec4(aPosition, 1.0);
  vPosition = aPosition;
}
`;


let fs = `
precision mediump float;

uniform float uTime;
uniform vec3 uCursor;
varying vec3 vPosition;

const float PI  = 3.1415926535897932384626433832795;

//computes a sphere of radius r
float computeZ(vec2 xy, float r) {
  // rr = xx + yy + zz
  float zz = r*r - xy.x * xy.x - xy.y * xy.y;
  if (zz < 0.) {
    return -1.;
  } else {
    return sqrt(zz);
  }
}

float linlin(float a, float b, float c, float d, float i) {
  return (i - a)/(b-a) * (d-c) + c;
}

void main(void) {
  float x = vPosition.x;
  float y = vPosition.y;
  float z = computeZ(vPosition.xy, 1.0);

  float s = 0.0;

  if (z > 0.) {
    // start with dark shade
    s = 0.2;

    // add diffuse shading where surface faces the light

    float k =  0.25 * (sin(uTime) / 2. + 0.5) + 0.25;

    // dot the normal and light
    // lambertian shading from upper right


    //Whoa I fucked up here, but its cool

    vec3 n = vec3(x, y, z);

    float theta = linlin(-1., 1., -1. * PI, 1.0 * PI, uCursor.x);
    float phi =  linlin(-1., 1., -1.0 * PI, 1.0 * PI, uCursor.y);
    vec3 l = vec3(sin(theta)*cos(phi), sin(phi), cos(theta) * cos(phi));

    float theta_bad = linlin(-1., 1., -1. * PI, 1.0 * PI, x);
    float phi_bad =  linlin(-1., 1., -1.0 * PI, 1.0 * PI, y);
    vec3 l_bad = vec3(sin(theta_bad)*cos(phi_bad), sin(phi_bad), cos(theta_bad) * cos(phi_bad));

    s += k * max(0., dot(n, vec3(1., 1., 1.)));
    s += k * 5.0;

    float d = dot(n, l);

    float e = max(0., dot(n - l, l_bad));


    // s *= sin(z * sin(z* sin(z * uTime) * uTime));
    s *= sin(sin(d * (pow(2.0, 2.0  +  2.0 *(sin(uTime )))))* d);
    s += s * sin(sin(e * (pow(2.0, 2.0  +  2.0 *(sin(uTime)))))* e);



  }
  gl_FragColor = vec4(s * vec3(1.0, 1.0, 1.0), 1.0);
}
`;

export default React.createClass({
  render() {
    return (
        <Program vs={vs} fs={fs}/>
    );
  }
})

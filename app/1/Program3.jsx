
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


  float theta = linlin(-1., 1., -1. * PI, PI, uCursor.x);
  float phi =  linlin(-1., 1., -1./2. * PI, 1./2. * PI, uCursor.y);


  float lz = cos(theta) * cos(phi);
  float lx = sin(theta) * cos(phi);
  float ly = sin(phi);

  vec3 l = vec3(lx, ly, lz);

  float s = 0.0;


  //color sphere
  if (z > 0.) {
    // start with dark shade
    s = 0.4;

    // add diffuse shading where surface faces the light

    float k =  0.33 * (sin(uTime) / 2. + 0.5) + 0.33;

    // dot the normal and light
    // lambertian shading from upper right

    vec3 n = vec3(x, y, z);


    float d = dot(n, l);
    s += k * max(0., d);

    if (d > 0.) {
      s *= sin(sin(d * (pow(2.0, 10.0  +  2.*(sin(uTime/1000.)))))* d);
    }else {
      s *= sin(sin(d * (pow(2.0, 10.0  +  2.*(sin(uTime/1000.)))))* d) * 0.4;
    }
  }
  gl_FragColor = vec4(s * vec3(1.0, 1.0, 1.0), 1.0);

  if ((lx + -0.01 < x) &&  (x < lx + 0.01)) {
    if ((ly + -0.01 < y ) && (y < ly + 0.01)) {
      gl_FragColor = vec4(vec3(1.0, 0.0, 0.0), 1.0);
    }
  }

  // make red cylinder at normal
  
}
`;

export default React.createClass({
  render() {
    return (
        <Program vs={vs} fs={fs}/>
    );
  }
})

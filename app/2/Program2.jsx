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

const float PI  = 3.1415926535897932384626433832795;
uniform float uTime;
uniform vec3 uCursor;
varying vec3 vPosition;


vec4 sphere;
vec3 material;

vec3 Lrgb;
vec3 Ldir;


// compute intersection of ray with sphere.
// Return t if intersection, else return 10000.

float raySphere(vec3 V, vec3 W, vec4 sph) {

  // ray from center of sphere to V
  vec3 D = V - sph.xyz;


  float a = 1.;
  float b = 2. * dot(D, W);
  float c = dot(D, D) - sph.w*sph.w;



  //compute solution to (D - Wt)^2 = sph.r^2 

  float disc = b*b - 4. * a * c;

  if (disc < 0.) {
    return 10000.;
  }

  float t_1 = ((-1. * b) + sqrt(disc))/(2. * a);
  float t_2 = ((-1. * b) - sqrt(disc))/(2. * a);

  return min(t_1, t_2);

  // We get the smallest t, which is the first t that gives us a zero
}


// why isnt my shit shading properly?

//Diffusely shade a sphere
//  point is position of surface point
//  sphere is xyzr definition of sphere
//  material is rgb color of sphere


vec3 shadeSphere(vec3 point, vec4 sphere, vec3 material) {
  vec3 color;

  vec3 diffuse = vec3(0.5, 0.5, 0.5); //diffuse light color

  vec3 normal = (point - sphere.xyz)/ sphere.w; //make sure I swizzle correctly!!

  vec3 ambient = material/ 5.;

  // Light is going into the object, so we take the dot product of its inverse
  color = ambient;
  color += Lrgb * diffuse* max(0., dot(normal, -1. * Ldir));
  color += vec3(1.0, 0.0, 0.0) * diffuse* max(0., dot(normal, -1. * normalize(vec3(-1, -1, -1))));
  color += vec3(0.0, 1.0, 0.0) * diffuse* max(0., dot(normal, -1. * normalize(vec3(1, -1, -1))));

  //red: error

  // First, check normal is correct

  // points should be of certain length
  if (!((length(point) < 1.11803398875) && (length(point) > 0.5))) {
    color = vec3(1.0, 0., 0.);
  }

  // arithmetic is correct
  if (normal * sphere.w + sphere.xyz != point) {
    color = vec3(1.0, 0., 0.);
  }

  // normals should point towards the screen
  if (dot(normal, vec3(0., 0., 1.)) < 0.) {
    color = vec3(1.0, 0., 0.);
  }

  // Then check if Ldir is correct

  // // Ldir should point away from the screen
  // if (dot(Ldir, vec3(0., 0., -1.)) < 0.) {
  //   color = vec3(1.0, 0., 0.);
  // }

  return color;
}

float linlin(float a, float b, float c, float d, float i) {
  return (i - a)/(b-a) * (d-c) + c;
}

vec3 toSphere(float x, float y, float r) {
  float theta = linlin(-1., 1., -1. * PI, PI, x);
  float phi =  linlin(-1., 1., -1./2. * PI, 1./2. * PI, y);


  float ly = r * sin(phi);
  float lz = r * cos(theta) * cos(phi);
  float lx = r * sin(theta) * cos(phi);

  return vec3(lx, ly, lz);
}

void main(void) {

  vec2 c = uCursor.xy;

  //Light from infinity (diffuse lighting)
  // global variables

  Lrgb = vec3(0., 0., 1.0);
  Ldir = -1. * normalize(toSphere(c.x, c.y, 1.));


  // we want our light to go in the negative direction


  float f = 1.; //focal length

  vec3 V = vec3(0., 0., 0.);
  vec3 W = normalize(vec3(vPosition.x, vPosition.y, -1. * f)); //make unit length, in negative z
  //points into screen


  sphere = vec4(0., 0., -1., 0.5);
  material = 0.5 * vec3(1.0, 1.0, 1.0);

  vec3 color = vec3(0., 0., 0.);
  float t = raySphere(V, W, sphere);

  if (t < 10000.){
    color = shadeSphere(V + t*W, sphere, material);
  }

  // color.r = 0.5;

  color = pow(color, vec3(.45, .45, .45)); // Gamma correction

  gl_FragColor = vec4(color, 1.);
}
`;

export default React.createClass({
    render() {
      return (
              <Program vs={vs} fs={fs}/>
              );
    }
  })

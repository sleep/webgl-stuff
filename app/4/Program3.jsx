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


vec4 sphere[3];
vec3 material[3];

vec3 light_rgb[3];
vec3 light_dir[3];


// utility functions:
float linlin(float a, float b, float c, float d, float i) {
  return (i - a)/(b-a) * (d-c) + c;
}

vec3 inverseMercator(float x, float y, float r) {
  float theta = linlin(-1., 1., -1. * PI, PI, x);
  float phi =  linlin(-1., 1., -1./2. * PI, 1./2. * PI, y);


  float ly = r * sin(phi);
  float lz = r * cos(theta) * cos(phi);
  float lx = r * sin(theta) * cos(phi);

  return vec3(lx, ly, lz);
}

vec3 errorColor() {
  return vec3(1.0, 0., 0.);
}


// ray tracing functions:


// raySphere :: (vec3 V, vec3 W, vec4 sph) -> float t
// compute value of parameter t
// in intersection between ray W*t with sphere.
// Returns t if intersection, else return 10000.
float raySphere(vec3 V, vec3 W, vec4 sph) {
  // ray from center of sphere to V
  vec3 D = V - sph.xyz;


  //compute solution to quadratic equation (D - Wt)^2 = sph.r^2 

  float a = 1.;
  float b = 2. * dot(D, W);
  float c = dot(D, D) - sph.w*sph.w;


  float discriminant = b*b - 4. * a * c;
  if (discriminant < 0.) {
    return 10000.;
  }
  float t_1 = ((-1. * b) + sqrt(discriminant))/(2. * a);
  float t_2 = ((-1. * b) - sqrt(discriminant))/(2. * a);

  return min(t_1, t_2); // minimum = closer point
}


// shade :: (vec3 S, vec3 N, vec3 material, vec3 light_dir, vec3 light_rgb) -> vec3 color

vec3 shade(vec3 S, vec3 N, vec3 material, vec3 light_dir, vec3 light_rgb) {
  // // Tests:
  // normal should point towards the screen
  // if (dot(N, vec3(0., 0., 1.)) < 0.) {
  //   return errorColor();
  // }

  // ambient
  vec3 a_rgb = material/ 5.;

  // diffuse (lambert)
  vec3 d_rgb = vec3(0.5, 0.5, 0.5);

  // specular (blinn)
  vec3 s_rgb = vec3(0.5, 0.5, 0.5); // specular light color
  float shinyness = 6.;
  vec3 eye = -1. * normalize(S);
  vec3 halfway = normalize(-1. * light_dir + eye);


  vec3 color = a_rgb;
  color += light_rgb * d_rgb* max(0., dot(N, -1. * light_dir));
  color += light_rgb * s_rgb* pow(max(0., dot(N, halfway)), shinyness);

  return color;
}

// vec3 shadeWithShadows(vec3 S, vec3 N, vec3 material, vec3 light_dir, vec3 light_rgb, vec3 sphere[3]) {
// }


void main(void) {

  //INITIALZE RAY-TRACER

  // Viewer aka eye position
  vec3 V = vec3(0., 0., 0.);

  //focal length
  float f = 1.;

  //ray from viewer to point on image plane
  vec3 W = normalize(vec3(vPosition.x, vPosition.y, -1. * f));




  // INITIALIZE LIGHTS

  // Light from infinity (diffuse lighting)
  light_rgb[0] = vec3(0.5, 0.5, 0.5);
  light_dir[0] = -1. * normalize(inverseMercator(uCursor.x, uCursor.y, 1.));

  light_rgb[1] = vec3(0.0, 0.0, 0.0);
  light_dir[1] = normalize(vec3(-1.0, -1.0, -1.0));

  light_rgb[2] = vec3(0.0, 0.0, 0.0);
  light_dir[2] = normalize(vec3(1.0, -1.0, -1.0));




  // INITIALIZE OBJECTS
  // (orbiting spheres);

  // sphere dynamics
  vec3 center = vec3(0., 0., -1.);
  float r_1 = 0.5; float theta_1 = uTime/8.;
  float r_2 = 0.08; float theta_2 = uTime * 2.;

  // rotate around y axis
  vec3 orbit_1 = vec3(r_1 * cos(theta_1),0,  r_1 * sin(theta_1));
  vec3 orbit_2 = vec3(r_2 * cos(theta_2),0,  r_2 * sin(theta_2));

  sphere[0] = vec4(center, 0.25);
  sphere[1] = vec4(sphere[0].xyz + orbit_1, 0.05);
  sphere[2] = vec4(sphere[1].xyz + orbit_2, 0.01);

  // sphere properties
  material[0] = vec3(1.0, 1.0, 1.0);
  material[1] = vec3(1.0, 1.0, 1.0);
  material[2] = vec3(1.0, 1.0, 1.0);




  // CALCULATE SURFACE POINT
  // Loop through spheres to find closest surface point min_S

  float min_t = 10000.;
  vec3 min_S;
  vec3 min_N;
  vec3 min_material;

  for (int i = 0; i < 3; i++) {
    float t = raySphere(V, W, sphere[i]);
    if (t < min_t) {
      min_t = t;

      min_S = V + t*W;
      min_N = (min_S - sphere[i].xyz)/ sphere[i].w;
      min_material = material[i];
    }
  }

  // if surface point not found, color black and return.
  if (min_t >= 10000.) {
    gl_FragColor = vec4(0., 0., 0., 1.);
    return;
  }

  // SHADE POINT ON IMAGE PLANE
  // (INVARIANT: min_S, min_N, min_material are defined vec3's)

  vec3 color = vec3(0., 0., 0.); // output color

  // Loop over lights:
  for (int i = 0; i < 3; i ++) {
    color += shade(min_S, min_N, min_material, light_dir[i], light_rgb[i]);
  }


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
  });


// Todo: add lights

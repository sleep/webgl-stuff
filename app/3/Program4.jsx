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

struct Light {
  vec3 dir;
  vec3 rgb;
};

struct Surface {
  bool exists;

  // INVARIANT: exists -> the following are all defined:

  vec3 S; // surface point (position)
  vec3 N; // surface normal (orientation)

  vec3 material;
};

struct Plane {
  vec3 P; // position
  vec3 N; // normal

  vec3 material;
};

struct Sphere {
  vec3 P; // position
  float r; // radius

  vec3 material;
};

struct World {
  Sphere sphere[3];
  Plane plane[1];

  Light light[3];

};







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
float raySphere(vec3 V, vec3 W, Sphere sphere) {
  // ray from center of sphere to V
  vec3 D = V - sphere.P;


  //compute solution to quadratic equation (D - Wt)^2 = sph.r^2 

  float a = 1.;
  float b = 2. * dot(D, W);
  float c = dot(D, D) - sphere.r * sphere.r;


  if (b > 0.) {
    return 10000.; //sphere is behind us
  }

  float discriminant = b*b - 4. * a * c;
  if (discriminant < 0.) {
    return 10000.;
  }
  float t_1 = ((-1. * b) + sqrt(discriminant))/(2. * a);
  float t_2 = ((-1. * b) - sqrt(discriminant))/(2. * a);

  return min(t_1, t_2); // minimum = closer point
}

float rayPlane(vec3 V, vec3 W, vec3 P, vec3 N) {
  //compute solution to linear equation N*(V+Wt -P) = 0

  // only show if facing us
  if (dot(N, -1. * W) <= 0.) {
    return 10000.;
  }

  return dot(N, P-V)/dot(N, W);
}

// getSurface :: (vec3 V, vec3 W, World world) -> Surface surface
// where 
//   V is ray origin
//   W is ray direction
//   world is World data
// 
// Traces a ray from V in the W direction, returning a surface struct

Surface getSurface(vec3 V, vec3 W, World world) {
  // Loop through spheres to find closest surface point min_S
  Surface surf;

  surf.exists = false;
  float min_t = 10000.;

  // loop through spheres
  for (int i = 0; i < 3; i++) {
    float t = raySphere(V, W, world.sphere[i]);
    if (t < min_t) {
      min_t = t;

      surf.S = V + t*W;
      surf.N = (surf.S - world.sphere[i].P)/ world.sphere[i].r;
      surf.material = world.sphere[i].material;
      surf.exists = true;
    }
  }
  //loop through planes

  for (int i = 0; i<1; i++) {
    float t = rayPlane(V, W, world.plane[i].P, world.plane[i].N);
    if (t < min_t) {
      min_t = t;

      surf.S = V + t*W;
      surf.N = world.plane[i].N;
      surf.material = world.plane[i].material;
      surf.exists = true;
    }
  }
  return surf;
  // Remark: if I want to pass t value, then I should make a wrapper struct to return Ray and Surface
}


// shade :: (Surface surf, Light light) -> vec3 color
// Returns rgb data for a surface given a light

vec3 shade(Surface surf, Light light) {
  // if (!surf.exists) return errorColor();
  // // normal should point towards the screen
  // if (dot(surf.N, vec3(0., 0., 1.)) < 0.) return errorColor();

  // ambient
  vec3 a_rgb = surf.material/ 5.;

  // diffuse (lambert)
  vec3 d_rgb = vec3(0.5, 0.5, 0.5);

  // specular (blinn)
  vec3 s_rgb = vec3(0.5, 0.5, 0.5); // specular light color
  float shinyness = 6.;
  vec3 eye = -1. * normalize(surf.S);
  vec3 halfway = normalize(-1. * light.dir + eye);


  vec3 color = a_rgb;
  color += light.rgb * d_rgb* max(0., dot(surf.N, -1. * light.dir));
  color += light.rgb * s_rgb* pow(max(0., dot(surf.N, halfway)), shinyness);

  return color;
}



// shadeWithShadows :: (Surface surf, Light light, World world) -> vec3 color
// Returns rgb data for a surface given a light and the world

vec3 shadeWithShadows(Surface surf, Light light, World world) {
  // if (!surf.exists) return errorColor();

  // From our surface point, we trace in the negative light direction,
  // to see if an object occludes it.

  float epsilon = 0.01; //we add epsilon to prevent self-occlusion

  vec3 ldir = light.dir;
  vec3 V_prime = surf.S + epsilon * -1. * ldir;
  vec3 W_prime = -1. * ldir;

  // if (dot(surf.S, vec3(0., 0., -1.)) > 0.) {
  //     vec3 a_rgb = errorColor();
  //     return a_rgb;
  // }
  Surface dest = getSurface(V_prime, W_prime, world);

  if (dest.exists) {
    vec3 a_rgb = surf.material/ 5.;
    return a_rgb;
  }

  return shade(surf, light);
}



// rayTrace :: (vec3 V, vac3 W, World world) -> vec3 color
// where 
//   V is ray origin
//   W is ray direction
//   world is World data
// 
// Traces a ray from V in the W direction, returning a color

vec3 rayTrace(vec3 V, vec3 W, World world) {
  // CALCULATE SURFACE POINT

  Surface surf = getSurface(V, W, world);

  if (!surf.exists) {
    return vec3(0., 0., 0.);
  }

  // SHADE POINT ON IMAGE PLANE
  // (INVARIANT: surf is defined)

  vec3 color = vec3(0., 0., 0.); // output color

  // Loop over lights:
  for (int i = 0; i < 3; i ++) {
    Light light = world.light[i];
    if (light.rgb == vec3(0., 0., 0.)) continue;

    color += shadeWithShadows(surf, light, world);
  }

  return color;
}


void main(void) {

  World world;
  //INITIALZE VIEWER


  float f = 2.0; //focal length

  //ray from viewer to point on image plane
  vec3 W = normalize(vec3(vPosition.x, vPosition.y, -1. * f));
  vec3 V = vec3(0.0, 0., 0.);




  // INITIALIZE LIGHTS

  // Light from infinity (diffuse lighting)
  world.light[0].rgb = vec3(0.5, 0.5, 0.5);
  world.light[0].dir = -1. * normalize(inverseMercator(uCursor.x, uCursor.y, 1.));

  world.light[1].rgb = vec3(0.5, 0.5, 0.5);
  world.light[1].dir = normalize(vec3(-1.0, -1.0, -1.0));

  world.light[2].rgb = vec3(0.0, 0.0, 0.0);
  world.light[2].dir = normalize(vec3(1.0, -1.0, -1.0));




  // INITIALIZE OBJECTS
  // (orbiting spheres);

  // sphere dynamics
  vec3 center = vec3(0., 0., -1.);
  float r_1 = 0.5; float theta_1 = uTime/8.;
  float r_2 = 0.08; float theta_2 = uTime * 2.;

  // rotate around y axis
  vec3 orbit_1 = vec3(r_1 * cos(theta_1),0,  r_1 * sin(theta_1));
  vec3 orbit_2 = vec3(r_2 * cos(theta_2),0,  r_2 * sin(theta_2));

  world.sphere[0].r = 0.25;
  world.sphere[1].r = 0.05;
  world.sphere[2].r = 0.01;

  world.sphere[0].P = vec3(center);
  world.sphere[1].P = vec3(world.sphere[0].P + orbit_1);
  world.sphere[2].P = vec3(world.sphere[1].P + orbit_2);

  // sphere properties
  world.sphere[0].material = vec3(1.0, 1.0, 1.0);
  world.sphere[1].material = vec3(1.0, 1.0, 1.0);
  world.sphere[2].material = vec3(1.0, 1.0, 1.0);


  //plane
  world.plane[0].N = vec3(0., 1., 0.);
  world.plane[0].P = vec3(0., -0.25, 0.);
  world.plane[0].material = vec3(0.1, 0.1, 0.1);

  // RAY TRACE

  vec3 color = rayTrace(V, W, world);
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

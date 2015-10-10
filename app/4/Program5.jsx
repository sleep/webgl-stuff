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
  float shinyness;
};

struct Plane {
  vec3 P; // position
  vec3 N; // normal

  vec3 material;
  float shinyness;
};

struct Sphere {
  vec3 P; // position
  float r; // radius

  vec3 material;
  float shinyness;
};

struct IntersectionObj{
  Sphere sphere[6];
};

struct World {
  // Sphere sphere[1];
  IntersectionObj io[1];
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


// raySphere :: (vec3 V, vec3 W, vec4 sph) -> vec2 (t_min, t_max)
// compute value of parameter t
// in intersection between ray W*t with sphere.
// Returns t if intersection, else return 10000.
vec2 raySphere(vec3 V, vec3 W, Sphere sphere) {
  // ray from center of sphere to V
  vec3 D = V - sphere.P;


  //compute solution to quadratic equation (D - Wt)^2 = sph.r^2 

  float a = 1.;
  float b = 2. * dot(D, W);
  float c = dot(D, D) - sphere.r * sphere.r;


  if (b > 0.) {
    return vec2(10000., 10000.); //sphere is behind us
  }

  float discriminant = b*b - 4. * a * c;
  if (discriminant < 0.) {
    return vec2(10000., 10000.); // no solutions
  }
  float t_1 = ((-1. * b) + sqrt(discriminant))/(2. * a);
  float t_2 = ((-1. * b) - sqrt(discriminant))/(2. * a);

  return vec2(min(t_1, t_2), max(t_1, t_2)); // minimum = closer point
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
  // for (int i = 0; i < 3; i++) {
  //   float t = raySphere(V, W, world.sphere[i]).x;
  //   if (t < min_t) {
  //     min_t = t;

  //     surf.S = V + t*W;
  //     surf.N = (surf.S - world.sphere[i].P)/ world.sphere[i].r;
  //     surf.material = world.sphere[i].material;
  //     surf.shinyness = world.sphere[i].shinyness;
  //     surf.exists = true;
  //   }
  // }
  //loop through planes
  for (int i = 0; i<1; i++) {
    float t = rayPlane(V, W, world.plane[i].P, world.plane[i].N);
    if (t < min_t) {
      min_t = t;

      surf.S = V + t*W;
      surf.N = world.plane[i].N;
      surf.material = world.plane[i].material;
      surf.shinyness = world.plane[i].shinyness;
      surf.exists = true;
    }
  }

  // loop through IntersectionObjects
  for (int i = 0; i < 1; i++) {
    // we want to use the surface with the maximum in time
    // and the minimum out time
    float max_in = -10000.; // lower bound
    float min_out = 10000.; // upper bound
    Surface _surf;

    bool found = true;

    for (int j = 0; j < 6; j++) {
      vec2 in_out = raySphere(V, W, world.io[i].sphere[j]);
      float t_in = in_out[0];
      float t_out = in_out[1];

      // if intersection
      if (t_in < 10000.) {
        // INVARIANT: t_in, t_out are under 10000, aka their true values
        // surface exists

        if (t_in > max_in) { // time in greater than previous max in
          max_in = t_in;

          // we have to set _surf here, because we cannot have variable array references.

          _surf.S = V + t_in*W;
          _surf.N = (_surf.S - world.io[i].sphere[j].P)/ world.io[i].sphere[j].r;
          _surf.material = world.io[i].sphere[j].material;
          _surf.shinyness = world.io[i].sphere[j].shinyness;
          _surf.exists = true;
        }
        if (t_out < min_out) { // time out less than previous min out
          min_out = t_out;
        }
      } else {
        // We break and declare not found, because an intersection requires
        // the point to exist in all n objects
        found = false;
        break;
      }
    }

    // max_in must be less than max_out, because it must go in before it goes out

    // // max_in must be less than min_t to be in front of all the other objects
    // found = found && (max_in < min_out);

    // // max_in must be greater than its lower bound (-10000.)
    // found = found && (max_in > -10000.);

    // // min_out must be less thanthan its upper bound (10000.)
    // found = found && (min_out < 10000.);


    if (found && (max_in < min_t)) {
      surf = _surf;
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
  vec3 a_rgb = surf.material/ 6.;

  // diffuse (lambert)
  vec3 d_rgb = vec3(0.4, 0.4, 0.4);

  // specular (blinn)
  vec3 s_rgb = vec3(0.5, 0.5, 0.5); // specular light color
  float shinyness = surf.shinyness;
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
    vec3 a_rgb = surf.material/ 10.;
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
    return vec3(0.1, 0.2, 0.7);
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
  world.light[0].rgb = vec3(0.3, 0.3, 0.3);
  world.light[0].dir = -1. * normalize(inverseMercator(uCursor.x, uCursor.y, 1.));

  world.light[1].rgb = vec3(0.3, 0.3, 0.3);
  world.light[1].dir = normalize(vec3(-1.0, -1.0, -1.0));

  world.light[2].rgb = vec3(0.0, 0.0, 0.0);
  world.light[2].dir = normalize(vec3(1.0, -1.0, -1.0));




  // INITIALIZE OBJECTS



  float r_1 = 0.25; //radius of spheres
  float r_2 =  0.09; //distance from center

  float maxheight = 0.1;
  float height =  maxheight + sin(uTime) * maxheight;// in multiples of ball heights
  vec3 center = vec3(0., height, -1.);
  // r_2  must be less than r_1

  float theta = uTime/3.;
  float k = 1.0;
  float phase0 = sin(theta * 2. + 0. * PI) * k;
  float phase1 = sin(theta * 2. + 1. * PI) * k;
  float phase2 = sin(theta * 3. + 0. * PI) * k;
  float phase3 = sin(theta * 3. + 1. * PI) * k;
  float phase4 = sin(theta * 5. + 0. * PI) * k;
  float phase5 = sin(theta * 5. + 1. * PI) * k;

  world.io[0].sphere[0].r = r_1 + 0.01* phase0;
  world.io[0].sphere[1].r = r_1 + 0.01* phase1;
  world.io[0].sphere[2].r = r_1 + 0.01* phase2;
  world.io[0].sphere[3].r = r_1 + 0.01* phase3;
  world.io[0].sphere[4].r = r_1 + 0.01* phase4;
  world.io[0].sphere[5].r = r_1 + 0.01* phase5;


  float phi = sin(uTime) * 6.;

  vec3 dirA = normalize(vec3(cos(phi), 0., sin(phi)));
  vec3 dirB = normalize(vec3(0., 1., 0.));
  vec3 dirC = normalize(vec3(-1. * sin(phi),0.,  cos(phi)));


  world.io[0].sphere[0].P = center +  1.0 * r_2 * dirA;
  world.io[0].sphere[1].P = center + -1.0 * r_2 * dirA;
  world.io[0].sphere[2].P = center +  1.0 * r_2 * dirB;
  world.io[0].sphere[3].P = center + -1.0 * r_2 * dirB;
  world.io[0].sphere[4].P = center +  1.0 * r_2 * dirC;
  world.io[0].sphere[5].P = center + -1.0 * r_2 * dirC;

  for (int i = 0 ; i<6; i++) {
    world.io[0].sphere[i].material = vec3(1., 1., 1.);
  }

  for (int i = 0; i < 6; i++) {
    world.io[0].sphere[i].shinyness = 5.;
  }

  //plane
  world.plane[0].N = vec3(0., 1., 0.);
  world.plane[0].P = vec3(0., -0.25, 0.);
  world.plane[0].material = vec3(0.0, 1.0, 0.0);
  world.plane[0].shinyness = 3.;

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

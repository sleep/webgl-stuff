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
const vec3 SKY_COLOR = vec3(0.0, 0.0, 0.0);
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
  float reflectance;
  float opacity;

};

struct Plane {
  vec3 P; // position
  vec3 N; // normal

  vec3 material;
  float shinyness;
  float reflectance;
  float opacity;
};

struct Sphere {
  vec3 P; // position
  float r; // radius

  vec3 material;
  float shinyness;
  float reflectance;
  float opacity;
};

struct IntersectionObj{
  Sphere sphere[6];
};

struct World {
  Sphere sphere[3];
  Plane plane[1];

  Light light[2];

};







// utility functions:
float linlin(float a, float b, float c, float d, float i) {
  return (i - a)/(b-a) * (d-c) + c;
}

int fastFloor(float a) {
  return (a > 0.) ? int(a) : int(a - 1.);
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
  for (int i = 0; i < 3; i++) {
    vec2 _t = raySphere(V, W, world.sphere[i]);
    float t = _t.x > 0. ? _t.x : _t.y;
    if (t < min_t) {
      min_t = t;

      surf.S = V + t*W;
      surf.N = (surf.S - world.sphere[i].P)/ world.sphere[i].r;
      surf.material = world.sphere[i].material;
      surf.shinyness = world.sphere[i].shinyness;
      surf.reflectance = world.sphere[i].reflectance;
      surf.opacity = world.sphere[i].opacity;
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


      float k = 0.1;
      vec3 D = (world.plane[i].P - surf.S)/k;
      ivec3 M = ivec3(fastFloor(D.x), fastFloor(D.y), fastFloor(D.z));
      // ivec3 M = ivec3(D);

      float manhattan = float(M.x + M.y + M.z);
      

      // if integer manhattan distance is even, material, else black;
      // surf.material = mod(int(D.x) + floor(D.y) + floor(D.z), 2.) < 1.
      surf.material = mod(manhattan, 2.) < 1.
        ? world.plane[i].material
        : vec3(1.0, 1.0, 1.0);

      surf.shinyness = world.plane[i].shinyness;
      surf.reflectance = world.plane[i].reflectance;
      surf.opacity = world.plane[i].opacity;
      surf.exists = true;
    }
  }

  // loop through IntersectionObjects
  // for (int i = 0; i < 1; i++) {
  //   // we want to use the surface with the maximum in time
  //   // and the minimum out time
  //   float max_in = -10000.; // lower bound
  //   float min_out = 10000.; // upper bound
  //   Surface _surf;

  //   bool found = true;

  //   for (int j = 0; j < 6; j++) {
  //     vec2 in_out = raySphere(V, W, world.io[i].sphere[j]);
  //     float t_in = in_out[0];
  //     float t_out = in_out[1];

  //     // if intersection
  //     if (t_in < 10000.) {
  //       // INVARIANT: t_in, t_out are under 10000, aka their true values
  //       // surface exists

  //       if (t_in > max_in) { // time in greater than previous max in
  //         max_in = t_in;

  //         // we have to set _surf here, because we cannot have variable array references.

  //         _surf.S = V + t_in*W;
  //         _surf.N = (_surf.S - world.io[i].sphere[j].P)/ world.io[i].sphere[j].r;
  //         _surf.material = world.io[i].sphere[j].material;
  //         _surf.shinyness = world.io[i].sphere[j].shinyness;
  //         _surf.reflectance= world.io[i].sphere[j].reflectance;
  //         _surf.opacity= world.io[i].sphere[j].opacity;
  //         _surf.exists = true;
  //       }
  //       if (t_out < min_out) { // time out less than previous min out
  //         min_out = t_out;
  //       }
  //     } else {
  //       // We break and declare not found, because an intersection requires
  //       // the point to exist in all n objects
  //       found = false;
  //       break;
  //     }
  //   }

  //   if (found && (max_in < min_t)) {
  //     surf = _surf;
  //   }
  // }
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

vec3 rayTrace(vec3 V_initial, vec3 W_initial, World world) {

  //INITIAL CONDITION:
  vec3 color[8];
  float reflectance[8];
  float opacity[8];

  int coloring[8]; // 0 == white == unexplored, 1 == grey == frontiner, 2 == grey == frontier (second pass), 3 == black == explored (third pass)
  int level[8]; //depth of each
  int parent[8];
  bool isReflected[8];

  vec3 V[8];
  vec3 W[8];



  //existence stack
  for (int i=0; i< 8; i++) {
    coloring[i] = 0;
    parent[i] = -1; //exists means it contributes to coloring
  }

  isReflected[0] = true;
  coloring[0] = 2;
  color[0] = vec3(0., 0., 0.);
  reflectance[0] = 1.0;
  opacity[0] = 1.0;
  level[0] = 0;
  V[0] = V_initial;
  W[0] = W_initial;


  // Two pass
  // 1) pre-order traversal to populate tree (child depends on parent)
  // 2) post-order tranversal to do reducing (parent depends on child)

  // PRE-ORDER TRAVERSAL
  for (int i = 1; i < 8; i++) {
    //initialize p

    bool found = false;
    // find level-1 parents
    for (int j = 0; j < 8; j++) {
      if (found) break;
      // if grey level 1
      if (coloring[j] == 1) {
        parent[i] = j;
        level[i] = level[j] + 1;
        coloring[j] += 1;
        found = true;
        isReflected[i] = true;

        //get Parent surface
        Surface surf = getSurface(V[j], W[j], world);

        //set color
        vec3 _color = vec3(0., 0., 0.);

        if (!surf.exists) {
          _color = reflectance[j] * SKY_COLOR;
          color[i] = _color;
          coloring[i] = 3; //done
          break;
        }

        //loop over lights
        for (int k = 0; k < 2; k ++) {
          _color += shadeWithShadows(surf, world.light[k], world);
        }

        //set color
        color[i] = _color;

        //reflective
        V[i] = surf.S;
        W[i] = 2. * (dot(-1. * W[j], surf.N)) * surf.N - (-1. * W[j]);
        reflectance[i] = surf.reflectance;
        opacity[i] = surf.opacity;
        coloring[i] = 1; //first pass out of three passes
        // second two will be from child

        // if leaf
        if (level[i] == 3) {
          coloring[i] = 3;
          break;
        }
        // if (reflectance[i] <= 0.) {
        //   if (opacity[i] <= 0.) {
        //     coloring[i] = 3;
        //     break;
        //   } else {
        //     coloring[i] = 2;
        //     break;
        //   }
        // }
        break;
      }
    }
    if (found) continue;

    // find level 2 parents
    for (int j = 0; j < 8; j++) {
      if (found) break;
      if (coloring[j] ==  2) {
        parent[i] = j;
        level[i] = level[j] + 1;
        found = true;
        coloring[j] += 1; // now three and done
        isReflected[i] = false;

        //get Parent surface
        Surface surf = getSurface(V[j], W[j], world);

        vec3 _color = vec3(0., 0., 0.);

        if (!surf.exists) {
          _color = reflectance[j] * SKY_COLOR;
          color[i] = _color;
          coloring[i] = 3; //done
          break;
        }

        //loop over lights
        for (int i = 0; i < 2; i ++) {
          _color += shadeWithShadows(surf, world.light[i], world);
        }

        //set color
        color[i] = _color;

        //opacity
        V[i] = surf.S;
        W[i] = W[j]; // go through
        reflectance[i] = surf.reflectance;
        opacity[i] = surf.opacity;
        coloring[i] = 1; //first pass out of three passes

        // if leaf
        if (level[i] == 3) {
          coloring[i] = 3;
          break;
        }

        // if (reflectance[i] <= 0.) {
        //   if (opacity[i] <= 0.) {
        //     coloring[i] = 3;
        //     break;
        //   } else {
        //     coloring[i] = 2;
        //     break;
        //   }
        // }
        break;
      }
    }
  }

  // POST-ORDER TRAVERSAL
  // INVARIANT: parent[i] is parent index of color[i]
  for (int i = 7; i >= 1; i--) {
    if (parent[i] < 0) {
      break;
    }
    for (int j = 0; j < 8; j++) {
      if (j == parent[i]) {
        // POST-LOOP
        float scale = isReflected[i]
          ? reflectance[j]
          : opacity[j];

        color[j] = color[j] * (1. - scale) + scale * color[i];
        break;
      }
    }
  }
  return color[0];
}

vec3 rayTraceWithoutOpacity(vec3 V_initial, vec3 W_initial, World world) {

  //INITIAL CONDITION:
  vec3 color = vec3(0., 0., 0.); // output color. Mutated over iteration
  float reflectance = 1.0; // Reflectance, mutated over iteration
  float opacity = 1.0; // Opacity, mutated over iteration
  vec3 V = V_initial;
  vec3 W = W_initial;


  // 2 ** 3 == 8
  for (int i = 0; i < 8; i++) {
    //INVARIANT: (reflectance > 0) || (opacity > 0)
    // V, W, reflectance belong to current iteration

    Surface surf = getSurface(V, W, world);
    vec3 _color = vec3(0., 0., 0.);

    if (!surf.exists) {
      _color = SKY_COLOR;
      // POST-LOOP
      color = color * (1. - reflectance) + reflectance * _color;
      break;
    }

    for (int i = 0; i < 2; i ++) {
      Light light = world.light[i];

      _color += shadeWithShadows(surf, light, world);
    }

    // POST-LOOP
    color = color * (1. - reflectance) + reflectance * _color;

    reflectance *= surf.reflectance;
    V = surf.S;
    W = surf.N;

    //OPTIMIZATION
    if (reflectance < 0.) break;
    // if (reflectance < 0. && opacity < 0.) break;
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




  // INITIALIZE OBJECTS
  vec3 center = vec3(0., 0., -1.5);
  float theta = uTime * 0.5;
  float r_1 = 0.4; //rotational radius
  float r_sphere = 0.25;

  for (int i = 0; i < 3; i++) {
    //rotation around y axis
    float rot_phase = float(i) * 2.0 * PI / 3.0;
    float rot_angle = theta + rot_phase;
    world.sphere[i].P = center + r_1 * vec3(cos(rot_angle), 0., sin(rot_angle));
    world.sphere[i].r = r_sphere;
    world.sphere[i].material = vec3(1.0, 1.0, 1.0);
    world.sphere[i].shinyness = 6.;
    world.sphere[i].reflectance = 0.5;
    world.sphere[i].opacity = 0.5;
  }




  //plane
  world.plane[0].N = normalize(vec3(0., 1., 0.));
  world.plane[0].P = vec3(0., -0.50, -1.);
  world.plane[0].material = vec3(0.0, 0.0, 0.0);
  world.plane[0].shinyness = 3.;
  world.plane[0].reflectance = 0.0;
  world.plane[0].opacity = 1.0;

  // RAY TRACE

  vec3 color = rayTrace(V, W, world);
  color = pow(color, vec3(.45, .45, .45)); // Gamma correction
  gl_FragColor = vec4(color, 1.);
}
`;

export default React.createClass({
    render() {
      return (
              <Program width={200} height={200} vs={vs} fs={fs}/>
              );
    }
  });


// Todo: add lights

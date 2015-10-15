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

// Goal: monotonic, slope bounded between 1 and 0
float time;


struct Light {
  vec3 dir;
  vec3 rgb;
};

struct Surface {
  bool exists;

  // INVARIANT: exists -> the following are all defined:

  vec3 S; // surface point (position)
  vec3 N; // surface normal (orientation)
  float t;

  vec3 material;
  float reflectance;
  float opacity;
  float eta; //ratio of refractive indicies from incident to that of inside the surface
};

struct Plane {
  vec3 P; // position
  vec3 N; // normal

  vec3 material;
  float reflectance;
  float opacity;
};

struct Sphere {
  vec3 P; // position
  float r; // radius

  vec3 material;
  float reflectance;
  float opacity;
  float eta; //ratio of refractive indicies from incident to that of inside the surface
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

float rand(vec2 n) {
  return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);
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



  float discriminant = b*b - 4. * a * c;
  if (discriminant < 0.) {
    return vec2(10000., 10000.); // no solutions
  }
  float t_1 = ((-1. * b) + sqrt(discriminant))/(2. * a);
  float t_2 = ((-1. * b) - sqrt(discriminant))/(2. * a);

  float t_min = min(t_1, t_2);
  float t_max = max(t_1, t_2);

  if (t_max < 0.) {
    return vec2(10000., 10000.); //sphere is behind us
  }


  return vec2(t_min, t_max);
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
  surf.t = 10000.;

  surf.exists = false;

  // loop through spheres
  for (int i = 0; i < 3; i++) {
    vec2 _t = raySphere(V, W, world.sphere[i]);
    bool inside = _t.x < 0.;
    float t = inside ? _t.y : _t.x;
    if (t < surf.t) {
      surf.t = t;

      surf.S = V + t*W;
      surf.N = (surf.S - world.sphere[i].P)/ world.sphere[i].r;
      surf.N = inside ? surf.N * -1. : surf.N;
      surf.material = world.sphere[i].material;
      surf.reflectance = world.sphere[i].reflectance;
      surf.opacity = world.sphere[i].opacity;
      surf.eta = inside ? world.sphere[i].eta : 1./ world.sphere[i].eta;
      surf.exists = true;
    }
  }

  //loop through planes

  for (int i = 0; i<1; i++) {
    float t = rayPlane(V, W, world.plane[i].P, world.plane[i].N);
    if (t < surf.t) {
      surf.t = t;


      surf.S = V + t*W;
      surf.N = world.plane[i].N;


      float k = 0.3;
      // vec3 D = B*((world.plane[i].P - surf.S)/k);
      vec3 D = (world.plane[i].P - surf.S)/k;
      // ivec3 M = ivec3(fastFloor(D.x), fastFloor(D.y), fastFloor(D.z));
      ivec3 M = ivec3(D);

      float manhattan = float(M.x + M.y + M.z);
      

      // if integer manhattan distance is even, material, else black;
      // surf.material = mod(int(D.x) + floor(D.y) + floor(D.z), 2.) < 1.
      surf.material = mod(manhattan, 2.) < 1.
        ? world.plane[i].material
        : vec3(1.0, 1.0, 1.0);

      surf.reflectance = world.plane[i].reflectance;
      surf.opacity = world.plane[i].opacity;
      surf.eta = 1.;
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
  vec3 a_rgb = surf.material/ 6.;

  // diffuse (lambert)
  vec3 d_rgb = 0.5 * vec3(1.0, 1.0, 1.0);

  // specular (blinn)
  vec3 s_rgb = vec3(1.0, 1.0, 1.0); // specular light color
  vec3 eye = -1. * normalize(surf.S);
  vec3 halfway = normalize(-1. * light.dir + eye);


  vec3 color = a_rgb;
  color += light.rgb * d_rgb* max(0., dot(surf.N, -1. * light.dir));
  color += light.rgb * s_rgb* pow(max(0., dot(surf.N, halfway)), 6.);

  return color;
}



// shadeWithShadows :: (Surface surf, Light light, World world) -> vec3 color
// Returns rgb data for a surface given a light and the world

vec3 shadeWithShadows(Surface surf, Light light, World world) {
  // if (!surf.exists) return errorColor();

  // From our surface point, we trace in the negative light direction,
  // to see if an object occludes it.

  float epsilon = 0.001; //we add epsilon to prevent self-occlusion

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
  vec3 color = vec3(0., 0., 0.); // output color. Mutated over iteration
  float scale = 1.0; // Reflectance, mutated over iteration
  float t_total = 0.;
  vec3 V = V_initial;
  vec3 W = W_initial;

  // W += vec3(rand(sin(uTime * W.xy)), rand(sin(uTime *W.xy)), rand(sin(uTime * W.xy)));

  for (int i = 0; i < 9; i++) {
    //INVARIANT: reflectance > 0.
    // V, W, reflectance belong to current iteration

    Surface surf = getSurface(V, W, world);
    vec3 _color = vec3(0., 0., 0.);

    if (!surf.exists) {
      _color = SKY_COLOR;
      // POST-LOOP
      color = color * (1. - scale) + scale* _color;
      break;
    }
    //INVARIANT: surf exists
    t_total += surf.t;


    for (int i = 0; i < 2; i ++) {
      Light light = world.light[i];

      _color += shadeWithShadows(surf, light, world) *  min(1., 5./t_total);
    }

    // POST-LOOP
    color = color * (1. - scale) + scale * _color;

    bool canReflect = true;
    bool canTransmit = true;

    int action = 0; //nothing

    if (scale * surf.reflectance < 0.1) {
      canReflect = false;
    }else if (scale * (1. - surf.opacity) < 0.1) {
      canTransmit = false;
    }

    if (canReflect) {
      if (canTransmit) {
        action = rand(sin(time) * W.xy) > 0.5
          ? 1
          : 2;
        action = 2;
      }else {
        action = 1;
      }
    }else {
      if (canTransmit) {
        action = 2;
      }
      //else action = 0
    }

    if (action == 0) {
      break;
    }
    if (action == 1) {
      break;
      scale *= surf.reflectance;
      V = surf.S;
      W = 2. * (dot(-1. * W, surf.N)) * surf.N - (-1. * W);
      continue;
    }
    if (action == 2) {
      scale *= (1. - surf.opacity); //opacity 1.0 means filled
      vec3 incident = normalize(W);
      vec3 normal = normalize(surf.N);

      // if (dot(normal, incident) >  0.) { // should be in opposite directions
      //   return errorColor();
      // }

      float eta = surf.eta;

      float costhetai = (dot(-1. * incident, normal));
      float det = 1. - eta * eta * (1. - costhetai * costhetai);
      if (det < 0.) break; //total internal reflection

      W = (eta) * incident + (eta * costhetai - sqrt(det)) * normal;

      // W = normalize(refract(incident, normal, 1.));
      V = surf.S + 0.001 * W;
      continue;
    }
  }
  return color;
}


void main(void) {
  time = uTime + pow(sin(uTime/3.), 3.);

  World world;
  //INITIALZE VIEWER


  float f = 0.7; //focal length

  float th = time;
  float thw = PI + 0.1 *sin(time);
  mat3 rot = mat3(vec3(cos(th), 0., sin(th)), vec3(0., 1., 0.), vec3(sin(th), 0., -1. * cos(th)));
  mat3 wig = mat3(vec3(cos(thw), sin(thw), 0.), vec3(sin(thw), -1. * cos(thw), 0.), vec3(0., 0., 1.));

  float r_v =  2. + 0.5 * sin(time/10.);
  //ray from viewer to point on image plane
  vec3 W = rot *wig * normalize(vec3(vPosition.x, vPosition.y, -1. * f));
  vec3 V = r_v * rot * vec3(0., 0., 1.) + vec3(0., 0., sin(time) + 1.);




  // INITIALIZE LIGHTS

  // Light from infinity (diffuse lighting)
  world.light[0].rgb = vec3(0.3, 0.3, 0.3);
  world.light[0].dir = -1. * normalize(inverseMercator(uCursor.x, uCursor.y, 1.));

  world.light[1].rgb = vec3(0.3, 0.3, 0.3);
  world.light[1].dir = normalize(vec3(-1.0, -1.0, -1.0));




  // INITIALIZE OBJECTS
  vec3 center = vec3(0., 0.0, 0.0);
  // float theta = time * 0.5;
  float theta = 0.;
  float r_1 = 0.8; //rotational radius
  float r_sphere = 0.5;

  for (int i = 0; i< 3; i++) {
    //rotation around y axis
    float rot_phase = float(i) * 2.0 * PI / 3.0;
    float rot_angle = theta + rot_phase;
    world.sphere[i].P = center + r_1 * vec3(cos(rot_angle), 0., sin(rot_angle));
    world.sphere[i].r = r_sphere;
    world.sphere[i].material = vec3(0.6, 0.6, 0.6);
    world.sphere[i].reflectance = 0.5;
    world.sphere[i].opacity = 0.1;
    world.sphere[i].eta = 1.33;
  }



  //plane
  world.plane[0].N = vec3(0., 1.,0.);
  world.plane[0].P = vec3(2000., -0.5, 0.);
  world.plane[0].material = vec3(0.0, 0.0, 0.0);
  world.plane[0].reflectance = 0.4;
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
              <Program width={500} height={500} vs={vs} fs={fs}/>
              );
    }
  });


// Todo: add lights

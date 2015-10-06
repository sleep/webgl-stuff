attribute vec3 aPosition;
varying vec3 vPosition;

void main(void) {
  gl_Position = vec4(aPosition, 1.0);
  vPosition = aPosition;
}



// compileShader :: (gl, source, shaderType) -> Shader
// @throws Error on compilation error
function compileShader(gl, source, shaderType) {
  //assert(shaderType === gl.FRAGMENT_SHADER || shaderType === g.VERTEXT_SHADER);


  let shader = gl.createShader(shaderType);

  gl.shaderSource(shader, source);

  gl.compileShader(shader);


  let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    throw "could not compile shader:" + gl.getShaderInfoLog(shader);
  }

  return shader;
}


// createfs :: (gl, source) -> Shader
// @throws Error on compilation error
export const createfs = (gl, source) =>
        compileShader(gl, source, gl.FRAGMENT_SHADER);


// createvs :: (gl, source) -> Shader
// @throws Error on compilation error
export const createvs = (gl, source) =>
        compileShader(gl, source, gl.VERTEX_SHADER);


export const createProgram = (gl, vs, fs) => {

  let program = gl.createProgram();

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);

  gl.linkProgram(program);

  let success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    throw ("program failed to link:" + gl.getProgramInfoLog(program));
  }
  return program;
};

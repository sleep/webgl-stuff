import React from "react";
import {createfs, createvs, createProgram} from "./util";

import vs_source from "./vs.glsl";
import fs_source from "./fs.glsl";



export default React.createClass({
  componentDidMount() {
    let gl = this.gl = this.getDOMNode().getContext("webgl");
    this.updateProgram();
  },
  updateProgram() {
    let gl = this.gl;
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    let vs = createvs(gl, vs_source);
    let fs = createfs(gl, fs_source);

    let program = createProgram(gl, vs, fs);
    gl.useProgram(program);



    // Create a square as a strip of two triangles

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(
      [-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0]
    ), gl.STATIC_DRAW);

    // Assign attribute aPosition to each of square's verticies
    gl.aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(gl.aPosition);
    gl.vertexAttribPointer(gl.aPosition, 3, gl.FLOAT, false, 0, 0);

    /*     this.update(); */
    this.animate();

  },
  animate() {
    let gl = this.gl;

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.animationFrameRequest = requestAnimationFrame(this.animate);
  },
  componentDidUpdate() {
    console.log("updated!");
    this.updateProgram();
  },
  componentWillUnmount() {
    cancelAnimationFrame(this.animationFrameRequest);
  },
  render() {
    let width = 600;
    let height = 600;

    return (
      <canvas width={width} height={height}>Insert webgl here!</canvas>
    )
  }
});


// TODO: include mouse events
// TODO: include componentDidUpdate();

import React from "react";
import {createfs, createvs, createProgram} from "./util";

import vs_source from "./vs.glsl";
import fs_source from "./fs.glsl";



const text = `
Lambertian Shading
`;

export default React.createClass({
  componentDidMount() {
    let canvas = this.refs.canvas.getDOMNode();
    let gl = this.gl = canvas.getContext("webgl");

    this.time0 = new Date().getTime() / 1000; //set initial time in seconds



    function setMouse(event, z) {
      let r = event.target.getBoundingClientRect();
      gl.cursor.x = (event.clientX - r.left) / (r.right - r.left) * 2 -1;
      gl.cursor.y = (event.clientY - r.bottom) / (r.top - r.bottom) * 2 - 1;

      if (z !== undefined) {
        gl.cursor.z = z;
      }
    }

    canvas.onmousedown = (event) => setMouse(event, 1);
    canvas.onmousemove = (event) => setMouse(event);
    canvas.onmouseup = (event) => setMouse(event, 0);
    gl.cursor = {x: 0, y: 0, z: 0};

    this.loadProgram();
  },
  loadProgram() {
    let gl = this.gl;


    let vs = createvs(gl, vs_source);
    let fs = createfs(gl, fs_source);

    let program = createProgram(gl, vs, fs);
    gl.useProgram(program);


    // Create a square as a strip of two triangles.

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([ -1,1,0, 1,1,0, -1,-1,0, 1,-1,0 ]), gl.STATIC_DRAW);

    // Assign attribute aPosition to each of the square's vertices.

    gl.aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(gl.aPosition);
    gl.vertexAttribPointer(gl.aPosition, 3, gl.FLOAT, false, 0, 0);

    // remember the address within the fragment shader of each of my uniforms variables

    gl.uTime = gl.getUniformLocation(program, "uTime");
    gl.uCursor = gl.getUniformLocation(program, "uCursor");

    if (!this.animationFrameRequest) {
      this.animate();
    }

  },
  animate() {
    let gl = this.gl;

    // set time
    gl.uniform1f(gl.uTime, (new Date().getTime() / 1000 - this.time0));

    // set cursor
    gl.uniform3f(gl.uCursor, gl.cursor.x, gl.cursor.y, gl.cursor.z);

    // render square
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.animationFrameRequest = requestAnimationFrame(this.animate);
  },
  componentDidUpdate() {
    console.log("updated!");
    this.loadProgram();
  },
  componentWillUnmount() {
    cancelAnimationFrame(this.animationFrameRequest);
  },
  render() {
    let width = 600;
    let height = 600;

    return (
      <div>
        <pre>
          {text}
        </pre>
        <canvas ref={"canvas"}
                width={width}
                height={height}>
          Insert webgl here!
        </canvas>
      </div>
    );
  }
});


// TODO: include mouse events
// TODO: include componentDidUpdate();

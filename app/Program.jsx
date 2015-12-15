import React, {PropTypes} from "react";
import {createfs, createvs, createProgram} from "./util";



export default React.createClass({
  propTypes: {
    vs: PropTypes.string.isRequired,
    fs: PropTypes.string.isRequired,
    width: PropTypes.number,
    height: PropTypes.number
  },
  getDefaultProps() {
    return {
      width: 800,
      height: 800
    }
  },
  getInitialState() {
    return {
      animation: false
    };
  },
  componentWillMount() {
    this.animationFrameRequest = null;
  },
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


    let vs = createvs(gl, this.props.vs);
    let fs = createfs(gl, this.props.fs);

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

    this.draw();

    if (this.state.animation) {
      console.log(this.animationFrameRequest);
      if (this.animationFrameRequest === null) {
        //INVARIANT: afr is non-null if we are animating.

        this.animationFrameRequest = requestAnimationFrame(this.animate);
      }
    }

  },
  draw() {

    let gl = this.gl;

    // set time
    gl.uniform1f(gl.uTime, (new Date().getTime() / 1000 - this.time0));

    // set cursor
    gl.uniform3f(gl.uCursor, gl.cursor.x, gl.cursor.y, gl.cursor.z);

    // render square
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  },
  animate() {
    this.draw()
    this.animationFrameRequest = requestAnimationFrame(this.animate);
  },
  componentDidUpdate() {
    console.log("updated!", this.state);

    if (!this.state.animation) {
      cancelAnimationFrame(this.animationFrameRequest);
      this.animationFrameRequest = null;
    }

    this.loadProgram();
  },
  componentWillUnmount() {
    cancelAnimationFrame(this.animationFrameRequest);
  },
  toggle() {
    this.setState((prev) => ({animation: !prev.animation}));
  },
  render() {
    let style = Object.assign({
      width: "100vmin",
      height: "auto"
    }, this.state.animation ? {} : {
      /*       opacity: 0.4, */
    });

    return (
      <div className={"programContainer"}>
        <canvas ref={"canvas"}
                onClick={this.toggle}
                style={style}
                className={"program"}
                width={this.props.width}
                height={this.props.height}>
            Insert webgl here!
        </canvas>
      </div>
    );
  }
});

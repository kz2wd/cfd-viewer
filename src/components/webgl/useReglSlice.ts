import { useCallback, useEffect, useRef } from "react";

import * as zarr from "zarrita";

import vertSrc from "./slice.vert.glsl";
import fragSrc from "./slice.frag.glsl";

export function useReglSlice(
  velMax: number,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  zarrUrl: string,
) {
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const velocityTexRef = useRef<WebGLTexture | null>(null);
  const pressureTexRef = useRef<WebGLTexture | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const propsRef = useRef<{ yplus: number; threshold: number }>({
    yplus: 0.1,
    threshold: 0.05,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    glRef.current = canvas.getContext("webgl2");
    const gl = glRef.current;
    if (!(gl instanceof WebGL2RenderingContext)) {
      console.error("WebGL2 not supported");
      return;
    }

    function compileShader(
      gl: WebGL2RenderingContext,
      type: number,
      src: string,
    ) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) ?? "shader error");
      }
      return shader;
    }

    velocityTexRef.current = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, velocityTexRef.current);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_3D, null);

    pressureTexRef.current = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, pressureTexRef.current);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(prog) ?? "link error");

    // Fullscreen quad made of 2 triangles
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const posLoc = gl.getAttribLocation(prog, "position");
    const locs = {
      yplus: gl.getUniformLocation(prog, "u_yplus"),
      threshold: gl.getUniformLocation(prog, "u_threshold"),
      velMax: gl.getUniformLocation(prog, "u_vel_max"),
      velocity: gl.getUniformLocation(prog, "u_velocity"),
      pressure: gl.getUniformLocation(prog, "u_pressure"),
    };

    gl.useProgram(prog);
    gl.uniform1i(locs.velocity, 0);
    gl.uniform1i(locs.pressure, 1);
    gl.uniform1f(locs.velMax, velMax);

    function draw() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.04, 0.04, 0.05, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(prog);

      // textures
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_3D, velocityTexRef.current);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, pressureTexRef.current);

      // set uniforms
      gl.uniform1f(locs.yplus, propsRef.current.yplus);
      gl.uniform1f(locs.threshold, propsRef.current.threshold);

      // Draw quad
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {};
  }, [velMax, canvasRef]);

  const loadTimeStep = useCallback(
    async (timeIdx: number) => {
      const gl = glRef.current;
      console.log(gl);
      console.log(pressureTexRef);
      console.log(velocityTexRef);
      if (!gl || !pressureTexRef || !velocityTexRef) return;

      const store = zarr.root(new zarr.FetchStore(zarrUrl));
      const velocity = await zarr.open(store.resolve("velocity_TXZY_uvwq"), {
        kind: "array",
      });
      const [, Nx, Nz, Ny] = velocity.shape;
      const velChunk = await zarr.get(velocity, [
        timeIdx,
        null,
        null,
        null,
        null,
      ]);
      const data = velChunk.data as Uint8Array;
      gl.bindTexture(gl.TEXTURE_3D, velocityTexRef.current);
      gl.texImage3D(
        gl.TEXTURE_3D,
        0,
        gl.RGBA8,
        Nx,
        Nz,
        Ny,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        data,
      );
      gl.bindTexture(gl.TEXTURE_3D, null);

      const pressure = await zarr.open(store.resolve("wall_pressure"), {
        kind: "array",
      });
      const [, px, pz] = pressure.shape;
      const pressureChunk = await zarr.get(pressure, [timeIdx, null, null]);
      const pressureData = pressureChunk.data as Uint8Array;
      gl.bindTexture(gl.TEXTURE_2D, pressureTexRef.current);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R8,
        px,
        pz,
        0,
        gl.RED,
        gl.UNSIGNED_BYTE,
        pressureData,
      );
      gl.bindTexture(gl.TEXTURE_2D, null);
      console.log(px, pz);
    },
    [zarrUrl],
  );

  return { loadTimeStep };
}

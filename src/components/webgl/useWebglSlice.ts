import { useCallback, useEffect, useRef, useState } from "react";

import * as zarr from "zarrita";

import vertSrc from "./slice.vert.glsl";
import fragSrc from "./slice.frag.glsl";
import type { WebGlData } from "../../types/webgl";
import type { ShaderProps } from "./shaderProps";

export function useWebglSlice(
  velMax: number,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  propsRef: React.RefObject<ShaderProps>,
  webglData: WebGlData,
) {
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const velocityTexRef = useRef<WebGLTexture | null>(null);
  const pressureTexRef = useRef<WebGLTexture | null>(null);
  const velocityColormapTexRef = useRef<WebGLTexture | null>(null);
  const pressureColormapTexRef = useRef<WebGLTexture | null>(null);
  const animFrameRef = useRef<number | null>(null);

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

    velocityColormapTexRef.current = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, velocityColormapTexRef.current);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    pressureColormapTexRef.current = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, pressureColormapTexRef.current);
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
      velMax: gl.getUniformLocation(prog, "u_vel_max"),
      velocity: gl.getUniformLocation(prog, "u_velocity"),
      pressure: gl.getUniformLocation(prog, "u_pressure"),
      velocityColormap: gl.getUniformLocation(prog, "u_velocity_colormap"),
      pressureColormap: gl.getUniformLocation(prog, "u_pressure_colormap"),
      velocityContourEnabled: gl.getUniformLocation(prog, "u_vel_cont_enabled"),
      velocityContourValue: gl.getUniformLocation(prog, "u_vel_cont_value"),
      velocityContourRange: gl.getUniformLocation(prog, "u_vel_cont_range"),
      pressureContourEnabled: gl.getUniformLocation(prog, "u_pre_cont_enabled"),
      pressureContourValue: gl.getUniformLocation(prog, "u_pre_cont_value"),
      pressureContourRange: gl.getUniformLocation(prog, "u_pre_cont_range"),
      qContourEnabled: gl.getUniformLocation(prog, "u_q_cont_enabled"),
      qContourValue: gl.getUniformLocation(prog, "u_q_cont_value"),
      qContourRange: gl.getUniformLocation(prog, "u_q_cont_range"),
    };

    gl.useProgram(prog);
    gl.uniform1i(locs.velocity, 0);
    gl.uniform1i(locs.pressure, 1);
    gl.uniform1i(locs.velocityColormap, 2);
    gl.uniform1i(locs.pressureColormap, 3);
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

      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, velocityColormapTexRef.current);

      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, pressureColormapTexRef.current);

      // set uniforms
      gl.uniform1f(locs.yplus, propsRef.current.yplus);

      // Velocity Contour
      gl.uniform1i(
        locs.velocityContourEnabled,
        propsRef.current.velocityContour.enabled ? 1 : 0,
      );
      gl.uniform1f(
        locs.velocityContourValue,
        propsRef.current.velocityContour.value,
      );
      gl.uniform1f(
        locs.velocityContourRange,
        propsRef.current.velocityContour.range,
      );

      // Pressure Contour
      gl.uniform1i(
        locs.pressureContourEnabled,
        propsRef.current.pressureContour.enabled ? 1 : 0,
      );
      gl.uniform1f(
        locs.pressureContourValue,
        propsRef.current.pressureContour.value,
      );
      gl.uniform1f(
        locs.pressureContourRange,
        propsRef.current.pressureContour.range,
      );

      // Q Contour
      gl.uniform1i(
        locs.qContourEnabled,
        propsRef.current.qContour.enabled ? 1 : 0,
      );
      gl.uniform1f(locs.qContourValue, propsRef.current.qContour.value);
      gl.uniform1f(locs.qContourRange, propsRef.current.qContour.range);

      // Draw quad
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      gl.deleteProgram(prog);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
      gl.deleteBuffer(buf);
      gl.deleteTexture(velocityTexRef.current);
      gl.deleteTexture(pressureTexRef.current);
      gl.deleteTexture(velocityColormapTexRef.current);
      gl.deleteTexture(pressureColormapTexRef.current);
    };
  }, [velMax, canvasRef, propsRef]);

  // Load colormap
  async function loadColormap(
    source: string,
    texTarget: React.RefObject<WebGLTexture>,
  ) {
    const gl = glRef.current;
    if (!gl || !texTarget) return;

    const colormap = new Image();
    colormap.crossOrigin = "Anonymous";
    colormap.src = source;
    colormap.onload = () => console.log("Image loaded successfully");
    colormap.onerror = (e) => console.error("Image failed to load", e);
    await colormap.decode();

    const canvas = new OffscreenCanvas(colormap.width, colormap.height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(colormap, 0, 0);

    const colormapData = ctx.getImageData(
      0,
      0,
      colormap.width,
      colormap.height,
    ).data;

    gl.bindTexture(gl.TEXTURE_2D, texTarget.current);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA8,
      colormap.width,
      colormap.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      colormapData,
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
  useEffect(() => {
    loadColormap("colormaps/viridis.png", velocityColormapTexRef);
    loadColormap("colormaps/magma.png", pressureColormapTexRef);
  }, []);

  const [timesteps, setTimesteps] = useState(0);

  const loadTimeStep = useCallback(
    async (timeIdx: number) => {
      const gl = glRef.current;
      if (!gl || !pressureTexRef || !velocityTexRef) return;

      const store = zarr.root(
        new zarr.FetchStore(new URL(webglData.path, window.location.href).href),
      );
      const velocity = await zarr.open(store.resolve("velocity_TXZY_uvwq"), {
        kind: "array",
      });
      const [timesteps, Nx, Nz, Ny] = velocity.shape;
      setTimesteps(timesteps);
      const velChunk = await zarr.get(velocity, [
        timeIdx,
        null,
        null,
        null,
        null,
      ]);
      const data = velChunk.data;
      gl.bindTexture(gl.TEXTURE_3D, velocityTexRef.current);
      gl.texImage3D(
        gl.TEXTURE_3D,
        0,
        webglData.velocity_format.gpu_format,
        Nx,
        Nz,
        Ny,
        0,
        webglData.velocity_format.cpu_format,
        webglData.velocity_format.type,
        data,
      );
      gl.bindTexture(gl.TEXTURE_3D, null);

      const pressure = await zarr.open(store.resolve("wall_pressure"), {
        kind: "array",
      });
      const [, px, pz] = pressure.shape;
      const pressureChunk = await zarr.get(pressure, [timeIdx, null, null]);
      const pressureData = pressureChunk.data;
      gl.bindTexture(gl.TEXTURE_2D, pressureTexRef.current);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        webglData.pressure_format.gpu_format,
        px,
        pz,
        0,
        webglData.pressure_format.cpu_format,
        webglData.pressure_format.type,
        pressureData,
      );
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
    [webglData],
  );

  return { loadTimeStep, timesteps };
}

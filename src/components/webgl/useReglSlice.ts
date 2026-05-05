import { useCallback, useEffect, useRef, type Ref } from "react";

import * as zarr from "zarrita";

import createREGL, { type Regl } from "regl";

import vertSrc from "./slice.vert.glsl";
import fragSrc from "./slice.frag.glsl";
import type REGL from "regl";

export function useReglSlice(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  zarrUrl: string,
) {
  const reglRef = useRef<Regl | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const texRef = useRef<WebGLTexture | null>(null);
  const drawRef = useRef<REGL.DrawCommand | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const regl = createREGL({
      canvas,
      attributes: { antialias: false },
      gl: canvas.getContext("webgl2"),
    });

    const gl = canvas.getContext("webgl2");
    if (!(gl instanceof WebGL2RenderingContext)) {
      console.error("WebGL2 not supported");
      return;
    }

    reglRef.current = regl;
    glRef.current = gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_3D, tex);

    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_3D, null);

    texRef.current = tex;

    drawRef.current = regl({
      vert: vertSrc,
      frag: fragSrc,

      attributes: {
        position: regl.buffer([
          [-1, -1],
          [1, -1],
          [-1, 1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ]),
      },
      uniforms: {},
      count: 6,
      primitive: "triangles",
    });

    const frame = regl.frame(() => {
      regl.clear({ color: [0.04, 0.04, 0.05, 1], depth: 1 });
      drawRef.current({});
    });

    return () => {
      frame.cancel();
      gl.deleteTexture(tex);
      regl.destroy();
    };
  }, []);

  const loadTimeStep = useCallback(
    async (timeIdx) => {
      const gl = glRef.current;
      const tex = texRef.current;

      if (!gl || !tex) return;
      const store = zarr.root(new zarr.FetchStore(zarrUrl));
      const velocity = await zarr.open(store.resolve("full_channel_uvwQ"), {
        kind: "array",
      });
      const [, , Ny, Nz, Nx] = velocity.shape;
      const velChunk = await zarr.get(velocity, [
        timeIdx,
        null,
        null,
        null,
        null,
      ]);
      const data = velChunk.data as Uint8Array;
      gl.bindTexture(gl.TEXTURE_3D, tex);
      gl.texImage3D(
        gl.TEXTURE_3D,
        0,
        gl.RGBA8,
        Nx,
        Ny,
        Nz,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        data,
      );
      gl.bindTexture(gl.TEXTURE_3D, null);
    },
    [zarrUrl],
  );

  return { loadTimeStep };
}

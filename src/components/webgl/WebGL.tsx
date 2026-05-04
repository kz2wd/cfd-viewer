import { useEffect, useRef, useState } from "react";
import createREGL from "regl";

function PressureCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [yPlus, setYPlus] = useState(0);
  const [timeIdx, setTimeIdx] = useState(0);

  useEffect(() => {
    const regl = createREGL({
      container: containerRef.current,
    });
    const gl = regl._gl;

    const texture3D = gl.createTexture();
    gl.bindTexture(gl.TEXTURE);
  }, []);

  return (
    <>
      <div ref={containerRef} />
    </>
  );
}

export function WebGL() {
  return (
    <>
      <h1>Web GL Pressure visualization</h1>
      <PressureCanvas />
    </>
  );
}

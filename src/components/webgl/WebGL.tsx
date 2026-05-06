import { useEffect, useRef } from "react";
import { useReglSlice } from "./useReglSlice";

function FlowViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { loadTimeStep } = useReglSlice(
    1.0,
    canvasRef,
    new URL("/data/simulation_export.zarr", window.location.href).href,
  );

  useEffect(() => {
    loadTimeStep(0);
  }, [loadTimeStep]);

  return (
    <>
      <div>
        <canvas ref={canvasRef} width={512} height={512} />
        <button onClick={() => loadTimeStep(10)}>Load 10</button>
      </div>
    </>
  );
}

export function WebGL() {
  return (
    <>
      <h1>Web GL Pressure visualization</h1>
      <FlowViewer />
    </>
  );
}

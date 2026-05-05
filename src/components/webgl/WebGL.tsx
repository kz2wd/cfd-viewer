import { useEffect, useRef } from "react";
import { useReglSlice } from "./useReglSlice";

function FlowViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { loadTimeStep } = useReglSlice(
    canvasRef,
    "./data/simulation_export.zarr",
  );

  useEffect(() => {
    loadTimeStep(0);
  }, [loadTimeStep]);

  return (
    <>
      <div>
        <canvas ref={canvasRef} width={512} height={512} />
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

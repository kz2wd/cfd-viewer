import { useEffect, useRef } from "react";
import { useReglSlice } from "./useReglSlice";

function FlowViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { loadTimeStep, timesteps, setYPlus, setThreshold } = useReglSlice(
    255.0,
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
        <div className="">
          <p>Timestep</p>
          <input
            type="range"
            min={0.0}
            max={timesteps - 1}
            step={1.0}
            onChange={(e) => loadTimeStep(Number(e.target.value))}
          />
        </div>
        <div className="">
          <p>y+</p>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            onChange={(e) => setYPlus(Number(e.target.value))}
          />
        </div>
        <div className="">
          <p>Treshold</p>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </div>
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

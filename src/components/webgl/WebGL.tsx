import { useEffect, useRef, useState } from "react";
import { useReglSlice } from "./useWebglSlice";

import Select from "react-select";

function FlowViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const r8Format = {
    gpu_format: WebGL2RenderingContext.R8,
    cpu_format: WebGL2RenderingContext.RED,
    type: WebGL2RenderingContext.UNSIGNED_BYTE,
  };
  const rgba8Format = {
    gpu_format: WebGL2RenderingContext.RGBA8,
    cpu_format: WebGL2RenderingContext.RGBA,
    type: WebGL2RenderingContext.UNSIGNED_BYTE,
  };
  const rf32Format = {
    gpu_format: WebGL2RenderingContext.R32F,
    cpu_format: WebGL2RenderingContext.RED,
    type: WebGL2RenderingContext.FLOAT,
  };
  const f32Format = {
    gpu_format: WebGL2RenderingContext.RGBA32F,
    cpu_format: WebGL2RenderingContext.RGBA,
    type: WebGL2RenderingContext.FLOAT,
  };

  const dataSourceOptions = [
    {
      value: {
        path: "/data/simulation_export.zarr",
        pressure_format: r8Format,
        velocity_format: rgba8Format,
      },
      label: "Default",
    },
    {
      value: {
        path: "/data/simulation_export_normzd.zarr",
        pressure_format: r8Format,
        velocity_format: rgba8Format,
      },
      label: "Normalized",
    },
    {
      value: {
        path: "/data/simulation_export_f32.zarr",
        pressure_format: rf32Format,
        velocity_format: f32Format,
      },
      label: "f32",
    },
  ];

  const [dataSource, setDataSource] = useState(dataSourceOptions[0]);

  const { loadTimeStep, timesteps, setYPlus, setOpacity } = useReglSlice(
    255.0,
    canvasRef,
    dataSource.value,
  );

  useEffect(() => {
    loadTimeStep(0);
  }, [loadTimeStep]);

  return (
    <>
      <div>
        <div className="flex">
          <p>Data Source</p>
          <Select
            options={dataSourceOptions}
            onChange={(choice) => setDataSource(choice)}
            value={dataSource}
          />
        </div>

        <canvas ref={canvasRef} width={1024} height={512} />
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
          <p>Opacity</p>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            onChange={(e) => setOpacity(Number(e.target.value))}
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

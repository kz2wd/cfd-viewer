import { useEffect, useRef, useState } from "react";
import { useWebglSlice } from "./useWebglSlice";

import Select from "react-select";

import "./webgl.css";
import { ShaderProps } from "./shaderProps";
import { ContourParamsComponent } from "./ContourParams";

function FlowViewer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shaderProps = new ShaderProps();
  const propsRef = useRef<ShaderProps>(shaderProps);

  const velocityContourRef = useRef(shaderProps.velocityContour);
  const pressureContourRef = useRef(shaderProps.pressureContour);
  const qContourRef = useRef(shaderProps.qContour);

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
        path: import.meta.env.BASE_URL + "/data/simulation_export.zarr",
        pressure_format: r8Format,
        velocity_format: rgba8Format,
      },
      label: "Default",
    },
    {
      value: {
        path: import.meta.env.BASE_URL + "/data/simulation_export_normzd.zarr",
        pressure_format: r8Format,
        velocity_format: rgba8Format,
      },
      label: "Normalized",
    },
    {
      value: {
        path: import.meta.env.BASE_URL + "/data/cans_simulation_export.zarr",
        pressure_format: r8Format,
        velocity_format: rgba8Format,
      },
      label: "CaNS",
    },
    {
      value: {
        path: import.meta.env.BASE_URL + "/data/simulation_export_f32.zarr",
        pressure_format: rf32Format,
        velocity_format: f32Format,
      },
      label: "f32",
    },
  ];

  const [dataSource, setDataSource] = useState(dataSourceOptions[1]);

  const { loadTimeStep, timesteps } = useWebglSlice(
    255.0,
    canvasRef,
    propsRef,
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
          <div className="selector">
            <Select
              options={dataSourceOptions}
              onChange={(choice) => setDataSource(choice)}
              value={dataSource}
            />
          </div>
        </div>

        <div className="flex">
          <div>
            <canvas ref={canvasRef} width={1024} height={512} />
            <div className="">
              <input
                type="range"
                min={0.0}
                max={timesteps - 1}
                step={1.0}
                onChange={(e) => loadTimeStep(Number(e.target.value))}
              />
              <p>Timestep</p>
            </div>
          </div>

          <div className="">
            <input
              className="vertical"
              type="range"
              min={0.0}
              max={1.0}
              step={0.01}
              onChange={(e) =>
                (propsRef.current.yplus = Number(e.target.value))
              }
            />
            <p>y+</p>
          </div>
        </div>

        <div className="flex">
          <ContourParamsComponent
            name={"Velocity Contour"}
            contourRef={velocityContourRef}
          />
          <ContourParamsComponent
            name={"Pressure Contour"}
            contourRef={pressureContourRef}
          />
          <ContourParamsComponent name={"Q Contour"} contourRef={qContourRef} />
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

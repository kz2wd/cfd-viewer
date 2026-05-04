import "./Pressure.css";

import { load } from "npyjs";
import { reshape } from "npyjs/reshape";
import { useEffect, useRef, useState } from "react";

import PlotModule from "react-plotly.js";

import Select from "react-select";

const Plot = (PlotModule as any).default ?? PlotModule;
import Plotly from "plotly.js-dist-min";

function PressurePlot({
  pressure,
  colormap,
  visuType,
  velocity,
  velocityOpacity,
  pressurePlotRef,
}: {
  pressure: number[][][];
  colormap: { value: string; label: string };
  visuType: { value: string; label: string };
  velocity: number[][][][];
  velocityOpacity: number;
  pressurePlotRef: React.RefObject;
}) {
  console.log("Reploting");

  useEffect(() => {
    if (!pressurePlotRef.current) return;

    const nx = pressure[0].length;
    const ny = pressure[0][0].length;

    Plotly.newPlot(
      pressurePlotRef.current,
      [
        {
          z: pressure[0],
          type: visuType.value,
          showscale: false,
          colorscale: colormap.value,
          zsmooth: "fast",
          dx: Math.PI / (nx - 1),
          dy: Math.PI / 2 / (ny - 1),
        },
        {
          z: velocity[0][0],
          type: "contour",
          showscale: false,
          colorscale: "Viridis",
          zsmooth: "fast",
          dx: Math.PI / (nx - 1),
          dy: Math.PI / 2 / (ny - 1),
          opacity: velocityOpacity,
          // line: { color: "white" },
        },
      ],
      {
        margin: { l: 0, r: 0, t: 0, b: 0 },
        autosize: true,
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "white" },
        xaxis: {
          showticklabels: false,
          ticks: "",
          showgrid: false,
          zeroline: false,
        },
        yaxis: {
          showticklabels: false,
          ticks: "",
          showgrid: false,
          zeroline: false,
          scaleanchor: "x",
        },
        showlegend: false,
      },
    );
  }, [
    pressure,
    colormap,
    visuType,
    velocity,
    velocityOpacity,
    pressurePlotRef,
  ]);
  return (
    <>
      <div ref={pressurePlotRef} style={{ width: "100%", height: "100%" }} />
    </>
  );
}

export function Pressure() {
  const [pressure, setPressure] = useState<number[][][] | null>(null);

  const [timeIndex, setTimeIndex] = useState<number>(0);
  const [velocityOpacity, setVelocityOpacity] = useState<number>(0.4);
  const [velocityLayer, setVelocityLayer] = useState<number>(7);

  const visuOptions = [
    { value: "contour", label: "Contour" },
    { value: "heatmap", label: "Heatmap" },
  ];
  const colormapOptions = [
    { value: "BWR", label: "BWR" },
    { value: "Viridis", label: "Viridis" },
    { value: "Cividis", label: "Cividis" },
  ];
  const [visuType, setVisuType] = useState(visuOptions[0]);
  const [colormap, setColormap] = useState(colormapOptions[0]);

  const pressurePlotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load_pressure() {
      const { data, shape, fortranOrder } = await load(
        import.meta.env.BASE_URL + "data/wall_pressure_time.npy",
      );
      const pressure = reshape(data, shape, fortranOrder);
      setPressure(pressure);
    }
    load_pressure().catch(console.error);
  }, []);

  const [channelVelocity, setChannelVelocity] = useState<number[][][][] | null>(
    null,
  );

  useEffect(() => {
    async function loadVelocity() {
      const { data, shape, fortranOrder } = await load(
        import.meta.env.BASE_URL + "data/full_velocity_time.npy",
      );
      const velocity = reshape(data, shape, fortranOrder);
      setChannelVelocity(velocity);
    }
    loadVelocity().catch(console.error);
  }, []);

  useEffect(() => {
    console.log("wanna change");
    if (!pressurePlotRef.current) return;
    Plotly.restyle(pressurePlotRef.current, { z: [pressure[timeIndex]] }, [0]);
    Plotly.restyle(
      pressurePlotRef.current,
      { z: [channelVelocity[timeIndex][velocityLayer]] },
      [1],
    );

    console.log("pressure rewrite");
  }, [
    timeIndex,
    pressure,
    colormap,
    visuType,
    channelVelocity,
    velocityLayer,
    velocityOpacity,
  ]);

  if (!pressure || !channelVelocity) return <div>loading</div>;
  console.log("Main comp");

  return (
    <>
      <div className="pressure-container">
        <h1>Wall Pressure</h1>
        <div className="pressure-params">
          <Select
            options={visuOptions}
            onChange={(choice) => setVisuType(choice)}
            value={visuType}
          />
          <Select
            options={colormapOptions}
            onChange={(choice) => setColormap(choice)}
            value={colormap}
          />
        </div>
        <PressurePlot
          pressure={pressure}
          colormap={colormap}
          visuType={visuType}
          velocity={channelVelocity}
          velocityOpacity={velocityOpacity}
          pressurePlotRef={pressurePlotRef}
        />
        <div className="scroll-control">
          <p>Time Index</p>
          <input
            type="range"
            min={0}
            max={pressure.length - 1}
            onChange={(e) => setTimeIndex(Number(e.target.value))}
            value={timeIndex}
          />
        </div>

        <div className="scroll-control">
          <p>y+ layer</p>
          <input
            type="range"
            min={0}
            max={channelVelocity[0].length}
            onChange={(e) => setVelocityLayer(Number(e.target.value))}
            value={velocityLayer}
          />
        </div>
        <div className="scroll-control">
          <p>Velocity Norm Opacity</p>
          <input
            type="range"
            min={0.0}
            max={1.0}
            step={0.01}
            onChange={(e) => setVelocityOpacity(Number(e.target.value))}
            value={velocityOpacity}
          />
        </div>
      </div>
    </>
  );
}

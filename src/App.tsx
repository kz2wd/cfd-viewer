import { Routes } from "react-router-dom";
import "./App.css";
import { Pressure } from "./components/pressure/Pressure";
import { Route } from "react-router";
import Navbar from "./components/navbar/Navbar";
import { WebGL } from "./components/webgl/WebGL";

function PlotlyPage() {
  return (
    <>
      <section id="center">
        <Pressure />
      </section>
      <section id="spacer"></section>
    </>
  );
}

function WebGLPage() {
  return (
    <>
      <section id="center">
        <WebGL />
      </section>
      <section id="spacer"></section>
    </>
  );
}

function Home() {
  return (
    <>
      <section id="center">
        <h1>
          Low-dimensional state estimation of turbulent structures from
          wall-pressure time series
        </h1>
      </section>

      <section id="spacer"></section>
    </>
  );
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/webgl" element={<WebGLPage />} />
        <Route path="/plotly" element={<PlotlyPage />} />
      </Routes>
    </>
  );
}

export default App;

import { NavLink } from "react-router-dom";

import "./Navbar.css";

export default function Navbar() {
  return (
    <nav>
      <NavLink to="/">Home</NavLink>
      <NavLink to="/webgl">Webgl Visualization</NavLink>
      <NavLink to="/plotly">Plotly Pressure</NavLink>
    </nav>
  );
}

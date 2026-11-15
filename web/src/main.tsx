import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "@fontsource-variable/instrument-sans";
import "./index.css";
import Home from "./Home";
import Room from "./Room";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/r/:code" element={<Room />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);

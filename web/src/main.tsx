import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "@fontsource-variable/schibsted-grotesk";
import "./index.css";
import Hub from "./Hub";
import Lobby from "./Lobby";
import Room from "./Room";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/odd-one" element={<Lobby />} />
        <Route path="/odd-one/:code" element={<Room />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);

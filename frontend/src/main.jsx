import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";

import "./index.css";
import "./style.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />

    <Toaster
      position="top-right"
      containerStyle={{
        top: 20,
        right: 20,
        zIndex: 9999999,
      }}
      toastOptions={{
        duration: 2500,
        style: {
          fontSize: "14px",
          fontWeight: 600,
          color: "#0f172a",
          background: "#ffffff",
          borderRadius: "10px",
          padding: "10px 16px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e2e8f0",
        },
      }}
    />
  </StrictMode>,
);

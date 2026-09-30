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
      toastOptions={{
        duration: 2000,
        style: {
          fontSize: "15px",
        },
      }}
    />
  </StrictMode>,
);

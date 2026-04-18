import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: "12px",
              fontSize: "14px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            },
            success: {
              style: { background: "#f2f8f0", color: "#336d30", border: "1px solid #c0debb" },
              iconTheme: { primary: "#448840", secondary: "#fff" },
            },
            error: {
              style: { background: "#fff5f5", color: "#c53030", border: "1px solid #fed7d7" },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

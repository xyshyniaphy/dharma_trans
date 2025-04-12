import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from 'react-bootstrap';
import { StrictMode } from "react";
import { RecoilRoot } from 'recoil';

// Importing the Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RecoilRoot>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </RecoilRoot>
  </StrictMode>,
);

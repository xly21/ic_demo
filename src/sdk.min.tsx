import "regenerator-runtime/runtime";
import React, { Suspense } from "react";
import { App } from "./App";
import shadowRoot from "react-shadow";
import css from "bundle-text:./sdk.css";
import { createRoot } from "react-dom/client";

let LagRadar: React.ComponentType;
if (process.env.NODE_ENV === "development") {
  // Load the LagRadar component lazily and only in development.
  // We don't want it to load in production.
  LagRadar = React.lazy(() => import("./LagRadar"));
}

// @ts-expect-error PinoutDiagrams does not exist of course.
window.PinoutDiagrams = {
  render: (
    container: Element,
    { ics, maxWidth }: { ics?: string[]; maxWidth?: string }
  ) => {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        {React.createElement(
          shadowRoot["div"]!,
          {},
          <style>
            {css}
            {`.wrapper {
             max-width: ${maxWidth !== undefined ? maxWidth : "100%"}
           }`}
          </style>,
          <App ics={Array.isArray(ics) ? ics : []} />
        )}
        {process.env.NODE_ENV === "development" && (
          <Suspense fallback={null}>
            <LagRadar />
          </Suspense>
        )}
      </React.StrictMode>
    );
  },
};

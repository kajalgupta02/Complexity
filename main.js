// React entry point. We dynamically load + transform App.js so JSX always works
// (even if the browser/CDN doesn't execute `type="text/babel"` external scripts).

const rootEl = document.getElementById("root");

function renderIfReady() {
  if (!window.App) {
    return false;
  }

  const appEl = React.createElement(window.App);

  // React 18 prefers `createRoot`, but some UMD bundles only expose `render`.
  // This fallback prevents a blank page when `createRoot` is missing.
  if (ReactDOM && typeof ReactDOM.createRoot === "function") {
    const root = ReactDOM.createRoot(rootEl);
    root.render(appEl);
  } else if (ReactDOM && typeof ReactDOM.render === "function") {
    ReactDOM.render(appEl, rootEl);
  } else {
    // eslint-disable-next-line no-console
    console.error("ReactDOM is missing createRoot/render. Check CDN scripts in index.html.");
  }

  return true;
}

// If App.js executed already, render immediately.
if (renderIfReady()) {
  // nothing else to do
} else {
  // Load App.js source, transpile JSX with Babel, then eval.
  fetch("./App.js")
    .then((res) => res.text())
    .then((src) => {
      if (!window.Babel || typeof window.Babel.transform !== "function") {
        throw new Error("Babel is missing. Ensure babel.min.js is loaded in index.html.");
      }

      const transformed = window.Babel.transform(src, { presets: ["react"] }).code;
      // eslint-disable-next-line no-eval
      eval(transformed);
      const ok = renderIfReady();
      if (!ok) throw new Error("window.App is still undefined after transforming App.js.");
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error("Failed to initialize app:", err);
      rootEl.innerHTML =
        "<div style='color: #ff4d6d; padding: 14px; font-family: ui-sans-serif, system-ui;'>Initialization failed. Check the console for details.</div>";
    });
}


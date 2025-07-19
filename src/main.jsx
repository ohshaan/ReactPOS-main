import { StrictMode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import { ToastContainer } from "react-toastify";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <ToastContainer />
        <App />
      </I18nextProvider>
    </Provider>
  </StrictMode>
);

import { createContext, useState } from "react";
export const AppContext = createContext();

export function AppContextProvider({ children }) {
  const [page, setPage] = useState("home");

  const navigateTo = (submitted) => {
    if (submitted === "quit") {
      quit();
    } else {
      setPage(submitted);
    }
  };

  const state = {
    socket: null,
    userId: null,
    token: null,
    server: null,
    api: null,
    page,
    navigateTo
  }
  return (
    <AppContext.Provider value={state}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppCtx() {
  const appContext = useContext(AppContext);

  if (!appContext) {
    throw new Error(
      "useAppCtx should be used within a AppContextProvider",
    );
  }

  return appContext;
}

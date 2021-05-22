import * as process from "process";

import { useRef, useState } from "react";

import { Home } from "./pages/home/Home";
import { Game } from "./pages/game/Game";
import { Howto } from "./pages/howto/Howto";

export function App() {
  const [page, setPage] = useState("home");

  const NAV = useRef({
    home: () => <Home onNavigation={handleNavigation} />,
    game: () => <Game onNavigation={handleNavigation} />,
    howto: () => <Howto onNavigation={handleNavigation} />,
  });

  // Navigation
  const handleNavigation = (submitted) => {
    if (submitted === "quit") {
      quit();
    } else {
      setPage(submitted);
    }
  };

  // Quit
  const quit = () => {
    process.exit(0);
  };

  return <element>{NAV.current[page]()}</element>;
}

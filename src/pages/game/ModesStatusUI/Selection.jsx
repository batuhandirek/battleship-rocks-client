import { useAppCtx } from "../../../appContext";
import { MENU_MAP, useGameCtx } from "../gameContext";

export function Selection() {

  const { dispatch } = useGameCtx()
  const { navigateTo } = useAppCtx()

  const handleGameSelection = ({ content }) => {
    const actionType = MENU_MAP[content];
    if (actionType === "back") {
      navigateTo('home');
    } else {
      dispatch({ type: actionType });
    }
  };

  return (
    <box top="center" left="center">
      <list
        onSelect={handleGameSelection}
        keys
        width={30}
        height={10}
        top={0}
        left="center"
        label="Menu"
        style={{
          fg: "blue",
          bg: "default",
          selected: {
            bg: "green",
          },
        }}
        invertSelected
        items={Object.keys(MENU_MAP)}
        focused></list>
    </box>
  );
}

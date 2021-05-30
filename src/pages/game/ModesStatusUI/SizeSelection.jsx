import { SIZE_CONFIG } from "../../../constants/GAME";
import { useGameCtx } from "../gameContext";
import { gameActions, MODES } from "../gameReducer";

export function SizeSelection() {
  const {
    isGamePrivate,
    dispatch
  } = useGameCtx();

  const handleGameSizeSelection = ({ content }) => {
    const size = Number(content.split("x")[0]);
    const nextStage = isGamePrivate ? MODES.CREATING : MODES.MATCHING;

    dispatch(
      gameActions.setGameSize({
        gameSize: size,
        stage: nextStage,
      }),
    );
  };
  return (
    <box top="center" left="center" height={30}>
      <box top="center" height="50%" left="center" width="100%">
        <text top="center" left="center">
          Select grid size
        </text>
      </box>
      <list
        onSelect={handleGameSizeSelection}
        keys
        width={30}
        left="center"
        top="50%+1"
        label="Menu"
        style={{
          fg: "blue",
          bg: "default",
          selected: {
            bg: "green",
          },
        }}
        invertSelected
        items={Object.keys(SIZE_CONFIG).map((size) => `${size}x${size}`)}
        focused
      />
    </box>
  );
}

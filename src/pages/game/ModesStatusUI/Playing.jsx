import { useAppCtx } from "../../../appContext";
import { useGameCtx } from "../gameContext";
import { Spinner } from '../../../components/Spinner'

export function Playing() {
  const { previousMoveUser, previousMoveShot, turn, isSubmitting } =
    useGameCtx();
  const { userId } = useAppCtx();

  return (
    <box left="center" top="center">
      {previousMoveUser && (
        <box top={0} height="50%" left="center" width="100%">
          {previousMoveUser === userId && previousMoveShot && (
            <text top="center" left="center">
              You hit!
            </text>
          )}
          {previousMoveUser === userId && !previousMoveShot && (
            <text top="center" left="center">
              You missed!
            </text>
          )}
          {previousMoveUser !== userId && previousMoveShot && (
            <text top="center" left="center">
              Enemy hit!
            </text>
          )}
          {previousMoveUser !== userId && !previousMoveShot && (
            <text top="center" left="center">
              Enemy missed!
            </text>
          )}
        </box>
      )}
      <box top="50%" height="50%" left="center" width="100%">
        <text top="center" left="center">
          {turn !== userId ? (
            "Your enemy is planning their attack."
          ) : isSubmitting ? (
            <Spinner tick={200} dotCount={3} />
          ) : (
            "Your turn, shoot away!"
          )}
        </text>
      </box>
    </box>
  );
}

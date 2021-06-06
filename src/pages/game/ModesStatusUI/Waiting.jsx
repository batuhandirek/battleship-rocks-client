import { useAppCtx } from "../../../appContext";
import { useGameCtx } from "../gameContext";
import { Spinner } from '../../../components/Spinner'

export function Waiting() {
  const {
    state: { gamePassword, gameId },
  } = useGameCtx();
  const { api, token, navigateTo } = useAppCtx();

  const handleCancelPrivateGame = async () => {
    await api.privateGameCancel({
      gameId: gameId,
      token: token,
    });
    navigateTo("home");
  };
  return (
    <box top="center" left="center">
      <box top={0} height="50%" left="center" width="100%">
        <text top="center" left="center">
          Code to join the room
        </text>
      </box>
      <box
        left="center"
        top="50%+1"
        content={gamePassword}
        height={3}
        width={20}
        align="center"
        valign="middle"
        mouse={true}
        style={{
          bold: true,
          bg: "green",
          fg: "white",
        }}
      />
      <box left="center" top="50%+6" height={1}>
        <text top="center" left="center">
          Waiting for opponent
        </text>
      </box>
      <box left="center" top="50%+8" height={5}>
        <Spinner
          tick={150}
          dotCount={5}
          boxProps={{ height: 2, left: "center" }}
        />
        <button
          top={3}
          left="center"
          width={17}
          height={1}
          keys={true}
          focused
          onPress={handleCancelPrivateGame}
          align="center"
          style={{ bold: true, bg: "green", fg: "white" }}
          content={`Cancel the game`}
          bold
        />
      </box>
    </box>
  );
}

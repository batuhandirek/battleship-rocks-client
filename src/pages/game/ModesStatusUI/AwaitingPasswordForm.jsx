import { useAppCtx } from "../../../appContext";
import { useGameCtx } from "../gameContext";
import { gameActions, gameActionTypes } from "../gameReducer";

export function AwaitingPasswordForm() {
  const {
    dispatch,
    state: { error },
  } = useGameCtx();
  const appCtx = useAppCtx();

  const handleJoinPrivateGame = async () => {
    const password = passwordInput.current.getValue();
    if (password.length !== 10) {
      dispatch(gameActions.error("Password has to be 10 characters"));
    } else {
      dispatch({ type: gameActionTypes.JOINING });

      const joinRes = await appCtx.api.privateGameJoin({
        password,
        token: appCtx.token,
      });

      // TODO: CHECK IF THIS NEEDS TO BE DONE AFTER SOME STATE UPDATE
      if (!joinRes.ok) {
        dispatch(gameActions.joiningError());
      }
    }
  };

  return (
    <form top="center" left="center" keys={true} focused>
      <box
        left="center"
        top="50%"
        content="Enter the game code below"
        align="center"
      />
      <textbox
        border={{ type: "line" }}
        style={{ focus: { fg: "green" } }}
        top="50%+2"
        left="center"
        width={13}
        height={3}
        name="password"
        inputOnFocus
        ref={passwordInput}
      />
      <box top={"50%+6"} width={24} height={3} left="center">
        <button
          content="Submit"
          style={{
            bold: true,
            focus: { bg: "green", fg: "white" },
          }}
          align="center"
          valign="middle"
          name="submit"
          width={8}
          height={1}
          keys={true}
          onPress={handleJoinPrivateGame}
        />
        <button
          left={16}
          content="Cancel"
          name="cancel"
          align="center"
          valign="middle"
          style={{
            bold: true,
            focus: { bg: "green", fg: "white" },
          }}
          width={8}
          height={1}
          keys={true}
          onPress={() => dispatch({ type: gameActionTypes.CANCEL_JOIN })}
        />
      </box>
      {error && (
        <box
          left="center"
          top="50%+8"
          height={2}
          content={error}
          align="center"
        />
      )}
    </form>
  );
}

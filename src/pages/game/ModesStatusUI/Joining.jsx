export function Joining() {
  return (
    <box top="center" left="center">
      <box top={0} height="50%" left="center" width="100%">
        <text top="center" left="center">
          Joining the private game
        </text>
      </box>
      <box left="center" top="50%">
        <Spinner
          tick={150}
          dotCount={10}
          boxProps={{ height: 2, left: "center" }}
        />
      </box>
    </box>
  );
}

import { useRef, useState, useEffect } from "react";

export function Spinner({
  tick = 100,
  dotCount = 6,
  width = 2,
  boxProps = {},
}) {
  const [tickCount, setTickCount] = useState(0);
  const interval = useRef()

  useEffect(() => {
    interval.current = setInterval(onTick, tick);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, []);

  function onTick() {
    setTickCount(tickCount + 1);
  }

  return (
    <box width={width * dotCount} {...boxProps}>
      {new Array(tickCount % (dotCount + 1)).fill(1).map((one, index) => (
        <text width={width} left={width * index} key={index}>
          .
        </text>
      ))}
    </box>
  );
}

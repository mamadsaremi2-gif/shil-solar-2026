import React from "react";

import {
  FixedSizeList
} from "react-window";

export default function VirtualList() {

  const Row = ({
    index,
    style,
  }) => (

    <div
      style={style}
      className="virtual-row-v15"
    >

      ITEM {index}

    </div>

  );

  return (

    <FixedSizeList
      height={320}
      width={"100%"}
      itemCount={200}
      itemSize={52}
    >

      {Row}

    </FixedSizeList>

  );
}

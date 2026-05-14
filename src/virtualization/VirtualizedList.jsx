import React from "react";
import { FixedSizeList } from "react-window";

export default function VirtualizedList({
  items = [],
  height = 400,
}) {

  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >

      {({ index, style }) => (

        <div
          style={style}
          className="virtual-item-v15"
        >

          {items[index]}

        </div>

      )}

    </FixedSizeList>
  );
}

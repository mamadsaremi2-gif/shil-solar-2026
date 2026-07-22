import React from "react";

import {
  DragDropContext,
  Droppable,
  Draggable,
} from "react-beautiful-dnd";

export default function DragWorkspace() {

  const items = [
    {
      id: "1",
      text: "Panel"
    },

    {
      id: "2",
      text: "Battery"
    },
  ];

  return (

    <DragDropContext
      onDragEnd={() => {}}
    >

      <Droppable
        droppableId="workspace"
      >

        {(provided) => (

          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="dnd-v15"
          >

            {items.map(
              (item, index) => (

              <Draggable
                key={item.id}
                draggableId={item.id}
                index={index}
              >

                {(provided) => (

                  <div
                    ref={provided.innerRef}

                    {...provided.draggableProps}

                    {...provided.dragHandleProps}

                    className="dnd-item-v15"
                  >

                    {item.text}

                  </div>

                )}

              </Draggable>

            ))}

            {provided.placeholder}

          </div>

        )}

      </Droppable>

    </DragDropContext>

  );
}

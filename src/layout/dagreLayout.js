import dagre from "dagre";

export function createLayout(
  nodes,
  edges
) {

  const graph =
    new dagre.graphlib.Graph();

  graph.setGraph({});

  graph.setDefaultEdgeLabel(
    () => ({})
  );

  nodes.forEach((node) => {

    graph.setNode(node.id, {
      width: 180,
      height: 60,
    });

  });

  edges.forEach((edge) => {

    graph.setEdge(
      edge.source,
      edge.target
    );

  });

  dagre.layout(graph);

  return nodes.map((node) => {

    const pos =
      graph.node(node.id);

    return {
      ...node,
      position: {
        x: pos.x,
        y: pos.y,
      },
    };
  });
}

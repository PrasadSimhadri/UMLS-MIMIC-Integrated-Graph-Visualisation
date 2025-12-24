export function toGraph(records) {
  const nodes = {};
  const edges = [];

  records.forEach(record => {
    Object.entries(record).forEach(([key, value]) => {

      // -------- NODE --------
      if (value?.labels && value?.properties) {
        const rawId = value.properties.id || value.properties.name || value.identity;
        const nodeId = rawId?.low ?? rawId;

        nodes[nodeId] = {
          id: nodeId.toString(),
          label: value.labels[0],
          title:
            value.properties.name ||
            value.properties.canonical_code ||
            value.properties.id ||
            nodeId.toString()
        };
      }

      // -------- RELATIONSHIP --------
      if (value?.type && value?.start && value?.end) {
        const from = value.start.low ?? value.start;
        const to = value.end.low ?? value.end;

        edges.push({
          from: from.toString(),
          to: to.toString(),
          label: value.type
        });
      }
    });
  });

//   console.log("GRAPH NODES:", nodes);
//   console.log("GRAPH EDGES:", edges);

  return {
    nodes: Object.values(nodes),
    edges
  };
}
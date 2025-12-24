"use client";

import { useEffect, useRef } from "react";
import { Network } from "vis-network";

// Define colors for each entity type
const nodeColors = {
  Patient: "#2563eb",      // Blue
  Drug: "#10b981",         // Green
  Diagnosis: "#f59e0b",    // Orange/Amber
  Encounter: "#8b5cf6"     // Purple
};

export default function GraphView({ graph, onNodeClick }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!graph || !ref.current) return;

    // Apply colors to nodes based on their group
    const coloredNodes = graph.nodes.map(node => ({
      ...node,
      color: nodeColors[node.group] || "#2563eb"
    }));

    const network = new Network(
      ref.current,
      { nodes: coloredNodes, edges: graph.edges },
      {
        nodes: {
          shape: "dot",
          size: 16,
          font: { color: "#000000" }
        },
        edges: {
          arrows: "to",
          color: "#374151",
          font: { color: "#000000" }
        },
        physics: {
          stabilization: true
        }
      }
    );

    // Handle node click
    network.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const clickedNode = graph.nodes.find(n => n.id === nodeId);
        if (clickedNode && onNodeClick) {
          onNodeClick(clickedNode);
        }
      } else {
        // Clicked on empty space - deselect
        if (onNodeClick) {
          onNodeClick(null);
        }
      }
    });

    return () => network.destroy();
  }, [graph, onNodeClick]);

  return (
    <div
      ref={ref}
      style={{
        height: "500px",
        backgroundColor: "#ffffff",
        border: "1px solid #ccc",
        borderRadius: "8px"
      }}
    />
  );
}
"use client";

import { useEffect, useRef } from "react";
import { Network } from "vis-network";

export default function GraphView({ graph }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!graph || !ref.current) return;

    const network = new Network(
      ref.current,
      graph,
      {
        nodes: {
          shape: "dot",
          size: 16,
          color: "#2563eb",
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

    return () => network.destroy();
  }, [graph]);

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
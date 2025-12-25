"use client";

import { useEffect, useRef, useState } from "react";
import { Network } from "vis-network";

// Define colors for each entity type with glow effect
const nodeColors = {
  Patient: {
    background: "#3b82f6",
    border: "#2563eb",
    highlight: { background: "#60a5fa", border: "#3b82f6" },
    hover: { background: "#60a5fa", border: "#3b82f6" }
  },
  Drug: {
    background: "#10b981",
    border: "#059669",
    highlight: { background: "#34d399", border: "#10b981" },
    hover: { background: "#34d399", border: "#10b981" }
  },
  Diagnosis: {
    background: "#f59e0b",
    border: "#d97706",
    highlight: { background: "#fbbf24", border: "#f59e0b" },
    hover: { background: "#fbbf24", border: "#f59e0b" }
  },
  Encounter: {
    background: "#111112ff",
    border: "#7c3aed",
    highlight: { background: "#a78bfa", border: "#8b5cf6" },
    hover: { background: "#a78bfa", border: "#8b5cf6" }
  }
};

const defaultColor = {
  background: "#6366f1",
  border: "#4f46e5",
  highlight: { background: "#818cf8", border: "#6366f1" },
  hover: { background: "#818cf8", border: "#6366f1" }
};

export default function GraphView({ graph, onNodeClick }) {
  const ref = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!graph || !ref.current) return;

    setIsLoading(true);

    // Apply enhanced colors to nodes based on their group
    const coloredNodes = graph.nodes.map(node => ({
      ...node,
      color: nodeColors[node.group] || defaultColor,
      font: {
        color: "#1a1a2e",
        size: 14,
        face: "Inter, sans-serif",
        strokeWidth: 3,
        strokeColor: "#ffffff"
      },
      shadow: {
        enabled: true,
        color: nodeColors[node.group]?.background || "#6366f1",
        size: 15,
        x: 0,
        y: 0
      }
    }));

    const network = new Network(
      ref.current,
      { nodes: coloredNodes, edges: graph.edges },
      {
        nodes: {
          shape: "dot",
          size: 22,
          borderWidth: 3,
          borderWidthSelected: 5,
          font: {
            color: "#1a1a2e",
            size: 14,
            face: "Inter, sans-serif",
            strokeWidth: 3,
            strokeColor: "#ffffff"
          },
          shadow: {
            enabled: true,
            size: 15,
            x: 0,
            y: 0
          },
          scaling: {
            min: 18,
            max: 30
          }
        },
        edges: {
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 0.8
            }
          },
          color: {
            color: "#a0aec0",
            highlight: "#6366f1",
            hover: "#6366f1"
          },
          width: 2,
          hoverWidth: 3,
          selectionWidth: 4,
          font: {
            color: "#4a5568",
            size: 12,
            face: "Inter, sans-serif",
            strokeWidth: 2,
            strokeColor: "#ffffff"
          },
          smooth: {
            type: "continuous",
            roundness: 0.5
          },
          shadow: {
            enabled: true,
            color: "rgba(0,0,0,0.1)",
            size: 5
          }
        },
        physics: {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 200,
            updateInterval: 25
          },
          barnesHut: {
            gravitationalConstant: -3000,
            centralGravity: 0.3,
            springLength: 150,
            springConstant: 0.05,
            damping: 0.4
          }
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          hideEdgesOnDrag: false,
          hideEdgesOnZoom: false,
          navigationButtons: false,
          keyboard: {
            enabled: true,
            speed: { x: 10, y: 10, zoom: 0.02 }
          },
          zoomView: true
        },
        layout: {
          improvedLayout: true,
          randomSeed: 42
        }
      }
    );

    // Handle stabilization
    network.on("stabilizationIterationsDone", () => {
      setIsLoading(false);
      network.setOptions({ physics: { enabled: false } });
    });

    // Handle node click
    network.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const clickedNode = graph.nodes.find(n => n.id === nodeId);
        if (clickedNode && onNodeClick) {
          onNodeClick(clickedNode);
        }
      } else {
        if (onNodeClick) {
          onNodeClick(null);
        }
      }
    });

    // Double click to focus
    network.on("doubleClick", (params) => {
      if (params.nodes.length > 0) {
        network.focus(params.nodes[0], {
          scale: 1.5,
          animation: {
            duration: 500,
            easingFunction: "easeInOutQuad"
          }
        });
      }
    });

    return () => network.destroy();
  }, [graph, onNodeClick]);

  return (
    <div style={containerStyle}>
      {/* Loading Overlay */}
      {isLoading && (
        <div style={loadingOverlayStyle}>
          <div style={loaderStyle}>
            <div style={spinnerStyle}></div>
            <span>Rendering graph...</span>
          </div>
        </div>
      )}

      {/* Graph Canvas */}
      <div
        ref={ref}
        style={graphStyle}
      />

      {/* Legend */}
      <div style={legendStyle}>
        <div style={legendItemStyle}>
          <span style={{ ...legendDotStyle, background: "#3b82f6" }}></span>
          <span>Patient</span>
        </div>
        <div style={legendItemStyle}>
          <span style={{ ...legendDotStyle, background: "#10b981" }}></span>
          <span>Drug</span>
        </div>
        <div style={legendItemStyle}>
          <span style={{ ...legendDotStyle, background: "#f59e0b" }}></span>
          <span>Diagnosis</span>
        </div>
        <div style={legendItemStyle}>
          <span style={{ ...legendDotStyle, background: "#111112ff" }}></span>
          <span>Encounter</span>
        </div>
      </div>

      {/* Interaction Hint */}
      <div style={hintStyle}>
        Click node for details | Scroll to zoom in/out
      </div>
    </div>
  );
}

/* Styles */
const containerStyle = {
  position: "relative",
  borderRadius: "20px",
  overflow: "hidden",
  background: "linear-gradient(145deg, #ffffff 0%, #faf5ff 100%)",
  border: "2px solid rgba(139, 92, 246, 0.2)",
  boxShadow: "0 8px 40px rgba(139, 92, 246, 0.15), 0 0 60px rgba(6, 182, 212, 0.08)"
};

const graphStyle = {
  height: "550px",
  width: "100%"
};

const loadingOverlayStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(255, 255, 255, 0.9)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10
};

const loaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "18px 28px",
  background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,245,255,0.9) 100%)",
  borderRadius: "16px",
  boxShadow: "0 8px 30px rgba(139, 92, 246, 0.2)",
  color: "#8b5cf6",
  fontWeight: 700,
  fontSize: "15px",
  border: "2px solid rgba(139, 92, 246, 0.2)"
};

const spinnerStyle = {
  width: "22px",
  height: "22px",
  border: "3px solid rgba(139, 92, 246, 0.2)",
  borderTopColor: "#8b5cf6",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite"
};

const legendStyle = {
  position: "absolute",
  top: "16px",
  left: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  padding: "16px 20px",
  background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,245,255,0.9) 100%)",
  backdropFilter: "blur(15px)",
  borderRadius: "16px",
  boxShadow: "0 4px 20px rgba(139, 92, 246, 0.15)",
  border: "2px solid rgba(139, 92, 246, 0.15)"
};

const legendItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#3730a3",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const legendDotStyle = {
  width: "14px",
  height: "14px",
  borderRadius: "50%",
  boxShadow: "0 0 12px currentColor",
  border: "2px solid rgba(255,255,255,0.8)"
};

const hintStyle = {
  position: "absolute",
  bottom: "16px",
  left: "50%",
  transform: "translateX(-50%)",
  padding: "12px 24px",
  background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,245,255,0.9) 100%)",
  backdropFilter: "blur(15px)",
  borderRadius: "30px",
  boxShadow: "0 4px 20px rgba(139, 92, 246, 0.15)",
  border: "2px solid rgba(139, 92, 246, 0.15)",
  fontSize: "13px",
  color: "#6366f1",
  fontWeight: 600,
  whiteSpace: "nowrap"
};
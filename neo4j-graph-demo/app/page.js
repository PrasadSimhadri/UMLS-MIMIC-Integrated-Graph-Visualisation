"use client";

import { useState, useEffect } from "react";
import GraphView from "@/components/GraphView";

export default function Home() {
    const [entity, setEntity] = useState("Patient");
    const [query, setQuery] = useState("PATIENT_DRUGS");
    const [inputValue, setInputValue] = useState("");
    const [records, setRecords] = useState([]);
    const [view, setView] = useState("graph");
    const [selectedNode, setSelectedNode] = useState(null);
    const [availableIds, setAvailableIds] = useState([]);
    const [loadingIds, setLoadingIds] = useState(false);
    const [isQuerying, setIsQuerying] = useState(false);

    // Fetch available IDs when entity changes
    useEffect(() => {
        async function fetchIds() {
            if (entity !== "Patient" && entity !== "Visit") {
                setAvailableIds([]);
                return;
            }

            setLoadingIds(true);
            try {
                const queryType = entity === "Patient" ? "ALL_PATIENTS" : "ALL_VISITS";
                const res = await fetch("/api/query", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ queryType, params: {} })
                });
                const data = await res.json();
                if (data.ids) {
                    setAvailableIds(data.ids);
                }
            } catch (err) {
                console.error("Failed to fetch IDs:", err);
                setAvailableIds([]);
            }
            setLoadingIds(false);
        }
        fetchIds();
    }, [entity]);

    async function runQuery() {
        if (!inputValue || inputValue.trim() === "") {
            alert("Please enter a valid input value");
            return;
        }

        const params =
            entity === "Patient"
                ? { id: inputValue.trim() }
                : entity === "Diagnosis"
                    ? { icd: inputValue.trim() }
                    : entity === "Drug"
                        ? { drug: inputValue.trim() }
                        : { visit: inputValue.trim() };

        if (
            (entity === "Patient" && !query.startsWith("PATIENT_")) ||
            (entity === "Diagnosis" && !query.startsWith("DIAG_")) ||
            (entity === "Drug" && !query.startsWith("DRUG_")) ||
            (entity === "Visit" && !query.startsWith("VISIT_"))
        ) {
            alert("Selected query does not match selected entity");
            return;
        }

        setIsQuerying(true);
        const res = await fetch("/api/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                queryType: query,
                params
            })
        });

        const data = await res.json();
        setRecords(data);
        setIsQuerying(false);
    }

    function getNodeTypeBadgeClass(nodeType) {
        const classes = {
            Patient: "node-badge patient",
            Drug: "node-badge drug",
            Diagnosis: "node-badge diagnosis",
            Encounter: "node-badge encounter"
        };
        return classes[nodeType] || "node-badge";
    }

    // Component to display node properties based on node type
    function NodePropertiesPanel({ node }) {
        if (!node) return null;

        const nodeType = node.group;
        const properties = node.properties || {};

        const propertyConfig = {
            Diagnosis: [
                { key: "icd_code", label: "ICD Code" },
                { key: "icd_version", label: "ICD Version" },
                { key: "canonical_code", label: "UMLS CUI" },
                // { key: "id", label: "Node ID" }
            ],
            Drug: [
                { key: "name", label: "Drug Name" },
                { key: "canonical_code", label: "RxNorm Code" },
                { key: "id", label: "Node ID" }
            ],
            Encounter: [
                { key: "id", label: "Encounter ID" },
                { key: "canonical_code", label: "Canonical Code" }
            ],
            Patient: [
                { key: "id", label: "Patient ID" },
                { key: "canonical_code", label: "Canonical Code" }
            ]
        };

        const config = propertyConfig[nodeType] || [];

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Header */}
                {/* <div style={propertyRowStyle}>
                    <span style={propertyLabelStyle}>Display Label</span>
                    <span style={propertyValueStyle}>{node.label}</span>
                </div> */}
                <div style={propertyRowStyle}>
                    <span style={propertyLabelStyle}>Type</span>
                    <span className={getNodeTypeBadgeClass(nodeType)}>{nodeType}</span>
                </div>
                {config.map(({ key, label }) => (
                    properties[key] && (
                        <div key={key} style={propertyRowStyle}>
                            <span style={propertyLabelStyle}>{label}</span>
                            <span style={propertyValueStyle}>{properties[key]}</span>
                        </div>
                    )
                ))}
            </div>
        );
    }

    function TableView({ rows }) {
        if (!rows || rows.length === 0) return (
            <div style={emptyStateStyle}>
                <p style={{ color: "#64748b", fontSize: "16px" }}>No data available</p>
            </div>
        );

        const columns = Object.keys(rows[0]);

        return (
            <div style={{ overflowX: "auto", borderRadius: "12px" }}>
                <table className="table-premium">
                    <thead>
                        <tr>
                            {columns.map(col => (
                                <th key={col}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i}>
                                {columns.map(col => (
                                    <td key={col}>{row[col] || "-"}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <main style={mainStyle}>
            {/* Hero Header */}
            <header style={headerStyle}>
                <div style={logoContainerStyle}>
                    <div>
                        <h1 className="gradient-text" style={titleStyle}>
                            UMLS-MIMIC Knowledge Graph Explorer
                        </h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={containerStyle}>
                {/* Control Panel */}
                <section className="glass-card hover-lift" style={controlPanelStyle}>
                    <h2 style={sectionTitleStyle}>
                        Query Configuration
                    </h2>

                    {/* Grid Layout for Controls */}
                    <div style={controlGridStyle}>
                        {/* Entity Selection */}
                        <div style={controlGroupStyle}>
                            <label style={labelStyle}>
                                Select Entity
                            </label>
                            <select
                                className="select-premium"
                                value={entity}
                                onChange={(e) => {
                                    const newEntity = e.target.value;
                                    setEntity(newEntity);
                                    setInputValue("");
                                    setRecords({});
                                    if (newEntity === "Patient") {
                                        setQuery("PATIENT_DIAGNOSES");
                                    } else if (newEntity === "Diagnosis") {
                                        setQuery("DIAG_PATIENTS");
                                    } else if (newEntity === "Drug") {
                                        setQuery("DRUG_PATIENTS");
                                    } else if (newEntity === "Visit") {
                                        setQuery("VISIT_DIAGNOSES");
                                    }
                                }}
                            >
                                <option value="Patient">Patient</option>
                                <option value="Visit">Visit</option>
                            </select>
                        </div>

                        {/* Query Selection */}
                        <div style={controlGroupStyle}>
                            <label style={labelStyle}>
                                Select Analysis
                            </label>
                            <select
                                className="select-premium"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setInputValue("");
                                    setRecords({});
                                }}
                            >
                                {entity === "Patient" && (
                                    <>
                                        <option value="PATIENT_DRUGS">Patient → Drugs Prescribed</option>
                                        <option value="PATIENT_DIAGNOSES">Patient → Diagnoses</option>
                                        <option value="PATIENT_ADMISSIONS">Patient → Visits (Admissions)</option>
                                    </>
                                )}
                                {entity === "Diagnosis" && (
                                    <option value="DIAG_PATIENTS">Diagnosis → Patients</option>
                                )}
                                {entity === "Drug" && (
                                    <option value="DRUG_PATIENTS">Drug → Patients Prescribed</option>
                                )}
                                {entity === "Visit" && (
                                    <>
                                        <option value="VISIT_DIAGNOSES">Visit → Diagnoses</option>
                                        <option value="VISIT_DRUGS">Visit → Drugs</option>
                                    </>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* Input Selection */}
                    <div style={{ marginTop: "24px" }}>
                        <label style={labelStyle}>
                            {entity === "Patient"
                                ? "Select Patient ID"
                                : entity === "Diagnosis"
                                    ? "Enter ICD Code"
                                    : entity === "Drug"
                                        ? "Enter Drug Name"
                                        : "Select Visit ID"}
                        </label>

                        {(entity === "Patient" || entity === "Visit") ? (
                            <select
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="select-premium"
                                disabled={loadingIds}
                            >
                                <option value="">
                                    {loadingIds ? "Loading..." : `-- Select ${entity} ID --`}
                                </option>
                                {availableIds.map(id => (
                                    <option key={id} value={id}>{id}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={entity === "Diagnosis" ? "e.g. I10 or 250.00" : "e.g. Furosemide"}
                                className="input-premium"
                            />
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div style={actionBarStyle}>
                        <button
                            onClick={runQuery}
                            className="btn-primary"
                            disabled={isQuerying}
                            style={{ display: "flex", alignItems: "center", gap: "10px" }}
                        >
                            {isQuerying ? (
                                <>
                                    <span style={spinnerStyle}></span>
                                    Querying...
                                </>
                            ) : (
                                "Run Query"
                            )}
                        </button>

                        {/* Status Badge */}
                        {!records.graph && !records.table && !isQuerying && (
                            <span className="status-badge info">
                                Run a query to visualize data
                            </span>
                        )}

                        {(records.graph || records.table) && (
                            <span className="status-badge success">
                                Data loaded successfully
                            </span>
                        )}

                        {/* View Toggle */}
                        <div style={toggleGroupStyle}>
                            <button
                                onClick={() => setView("graph")}
                                className={`btn-toggle ${view === "graph" ? "active" : ""}`}
                            >
                                Graph
                            </button>
                            <button
                                onClick={() => setView("table")}
                                className={`btn-toggle ${view === "table" ? "active" : ""}`}
                            >
                                Table
                            </button>
                        </div>
                    </div>
                </section>

                {/* Results Section */}
                <section style={resultsContainerStyle}>
                    {view === "graph" && records.graph && (
                        <div style={graphLayoutStyle}>
                            {/* Node Properties Panel */}
                            {selectedNode && (
                                <div className="glass-card" style={nodePanelStyle}>
                                    <div style={panelHeaderStyle}>
                                        <h3 style={panelTitleStyle}>
                                            Node Details
                                        </h3>
                                        <button
                                            onClick={() => setSelectedNode(null)}
                                            style={closeButtonStyle}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <NodePropertiesPanel node={selectedNode} />
                                </div>
                            )}
                            {/* Graph View */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <GraphView
                                    graph={records.graph}
                                    onNodeClick={(node) => setSelectedNode(node)}
                                />
                            </div>
                        </div>
                    )}

                    {view === "table" && records.table && (
                        <div className="glass-card" style={{ padding: "24px" }}>
                            <h3 style={{ ...panelTitleStyle, marginBottom: "16px" }}>
                                Query Results
                            </h3>
                            <TableView rows={records.table} />
                        </div>
                    )}

                    {/* Empty State */}
                    {!records.graph && !records.table && !isQuerying && (
                        <div className="glass-card" style={emptyStateContainerStyle}>
                            <div style={emptyStateStyle}>
                                <p style={emptyDescStyle}>
                                    Select an entity, choose an analysis type and run the query to visualize the KG.
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

/* ============================================
   STYLES
   ============================================ */

const mainStyle = {
    minHeight: "100vh",
    padding: "0",
    display: "flex",
    flexDirection: "column"
};

const headerStyle = {
    padding: "40px 50px 30px",
    background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,245,255,0.9) 100%)",
    backdropFilter: "blur(20px)",
    borderBottom: "2px solid rgba(139, 92, 246, 0.15)"
};

const logoContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    maxWidth: "1400px",
    margin: "0 auto"
};

const titleStyle = {
    fontSize: "36px",
    fontWeight: "800",
    margin: "0",
    letterSpacing: "-1px"
};

const subtitleStyle = {
    fontSize: "15px",
    color: "#64748b",
    marginTop: "6px",
    fontWeight: "500"
};

const containerStyle = {
    flex: 1,
    maxWidth: "1400px",
    width: "100%",
    margin: "0 auto",
    padding: "40px 50px"
};

const controlPanelStyle = {
    padding: "36px",
    marginBottom: "32px",
    background: "linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,245,255,0.85) 100%)"
};

const sectionTitleStyle = {
    fontSize: "20px",
    fontWeight: "800",
    color: "#3730a3",
    marginBottom: "28px",
    display: "flex",
    alignItems: "center"
};

const controlGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px"
};

const controlGroupStyle = {
    display: "flex",
    flexDirection: "column"
};

const labelStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
};

const actionBarStyle = {
    marginTop: "32px",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px"
};

const toggleGroupStyle = {
    display: "flex",
    gap: "8px",
    marginLeft: "auto"
};

const spinnerStyle = {
    width: "18px",
    height: "18px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
};

const resultsContainerStyle = {
    animation: "fadeInUp 0.4s ease"
};

const graphLayoutStyle = {
    display: "flex",
    gap: "24px",
    alignItems: "flex-start"
};

const nodePanelStyle = {
    width: "340px",
    padding: "28px",
    flexShrink: 0,
    animation: "fadeInUp 0.3s ease",
    background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,245,255,0.9) 100%)",
    border: "2px solid rgba(139, 92, 246, 0.15)"
};

const panelHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "2px solid rgba(139, 92, 246, 0.15)"
};

const panelTitleStyle = {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#3730a3",
    display: "flex",
    alignItems: "center"
};

const closeButtonStyle = {
    width: "36px",
    height: "36px",
    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)",
    border: "2px solid rgba(139, 92, 246, 0.2)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    color: "#8b5cf6",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
};

const propertyRowStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "14px",
    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)",
    borderRadius: "12px",
    border: "1px solid rgba(139, 92, 246, 0.1)"
};

const propertyLabelStyle = {
    fontSize: "11px",
    color: "#8b5cf6",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px"
};

const propertyValueStyle = {
    fontSize: "15px",
    color: "#1e1b4b",
    fontWeight: "600",
    wordBreak: "break-word"
};

const emptyStateContainerStyle = {
    padding: "100px 40px",
    textAlign: "center",
    background: "linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(250,245,255,0.85) 100%)"
};

const emptyStateStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px"
};

const emptyTitleStyle = {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "12px"
};

const emptyDescStyle = {
    fontSize: "17px",
    color: "#6366f1",
    maxWidth: "450px",
    lineHeight: "1.7",
    fontWeight: "500"
};

const footerStyle = {
    padding: "24px 50px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "14px",
    borderTop: "1px solid rgba(99, 102, 241, 0.1)",
    background: "rgba(255,255,255,0.8)"
};
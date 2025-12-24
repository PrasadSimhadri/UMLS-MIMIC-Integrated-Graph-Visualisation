"use client";

import { useState, useEffect } from "react";
import GraphView from "@/components/GraphView";
import { toGraph } from "@/lib/transform";

export default function Home() {
    const [entity, setEntity] = useState("Patient");
    const [query, setQuery] = useState("PATIENT_DRUGS");
    const [inputValue, setInputValue] = useState("");
    const [records, setRecords] = useState([]);
    const [view, setView] = useState("graph");
    const [selectedNode, setSelectedNode] = useState(null);
    const [availableIds, setAvailableIds] = useState([]);
    const [loadingIds, setLoadingIds] = useState(false);

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

        const queryDef = query; // current selected query

        if (
            (entity === "Patient" && !query.startsWith("PATIENT_")) ||
            (entity === "Diagnosis" && !query.startsWith("DIAG_")) ||
            (entity === "Drug" && !query.startsWith("DRUG_")) ||
            (entity === "Visit" && !query.startsWith("VISIT_"))
        ) {
            alert("Selected query does not match selected entity");
            return;
        }

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
    }

    const graphData = records.graph || null;

    // Component to display node properties based on node type
    function NodePropertiesPanel({ node }) {
        if (!node) return null;

        const nodeType = node.group;
        const properties = node.properties || {};

        // Define which properties to show for each node type
        const propertyConfig = {
            Diagnosis: [
                { key: "icd_code", label: "ICD Code" },
                { key: "icd_version", label: "ICD Version" },
                { key: "canonical_code", label: "Canonical Code (UMLS CUI)" },
                { key: "id", label: "Node ID" }
            ],
            Drug: [
                { key: "name", label: "Drug Name" },
                { key: "canonical_code", label: "Canonical Code (RxNorm)" },
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
            <div>
                <div style={propertyRowStyle}>
                    <span style={propertyLabelStyle}>Display Label</span>
                    <span style={propertyValueStyle}>{node.label}</span>
                </div>
                <div style={propertyRowStyle}>
                    <span style={propertyLabelStyle}>Type</span>
                    <span style={{ ...propertyValueStyle, ...getNodeTypeBadge(nodeType) }}>{nodeType}</span>
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

    function getNodeTypeBadge(nodeType) {
        const colors = {
            Patient: { backgroundColor: "#dbeafe", color: "#2563eb" },
            Drug: { backgroundColor: "#d1fae5", color: "#059669" },
            Diagnosis: { backgroundColor: "#fef3c7", color: "#d97706" },
            Encounter: { backgroundColor: "#ede9fe", color: "#7c3aed" }
        };
        return {
            ...colors[nodeType],
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "600"
        };
    }

    function TableView({ rows }) {
        if (!rows || rows.length === 0) return <p>No data</p>;

        const columns = Object.keys(rows[0]);

        return (
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginTop: "20px",
                    color: "#000"
                }}
            >
                <thead>
                    <tr>
                        {columns.map(col => (
                            <th
                                key={col}
                                style={{
                                    border: "1px solid #ccc",
                                    padding: "8px",
                                    background: "#f3f4f6"
                                }}
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i}>
                            {columns.map(col => (
                                <td
                                    key={col}
                                    style={{
                                        border: "1px solid #ccc",
                                        padding: "8px"
                                    }}
                                >
                                    {row[col] || "-"}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return (
        <main
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
                padding: "40px"
            }}
        >
            <div
                style={{
                    maxWidth: "900px",
                    margin: "auto",
                    background: "white",
                    padding: "25px",
                    borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)"
                }}
            >
                <h1 style={{ marginBottom: "20px", textAlign: "center", color: "black", fontSize: "22px" }}>
                    <b>Clinical Knowledge Graph Explorer</b>
                </h1>

                {/* 🔹 Controls */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px"
                    }}
                >
                    {/* Entity */}
                    <div style={{ color: "black" }}>
                        <label style={{ color: "black" }}><b>Select Entity</b></label>
                        <select
                            style={selectStyle}
                            value={entity}
                            onChange={(e) => {
                                const newEntity = e.target.value;
                                setEntity(newEntity);
                                setInputValue("");
                                setRecords({});
                                // FORCE correct default query per entity
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
                            {/* <option value="Diagnosis">Diagnosis</option>
                            <option value="Drug">Drug</option> */}
                            <option value="Visit">Visit</option>
                        </select>
                    </div>

                    {/* Query */}
                    <div style={{ color: "black" }}>
                        <label style={{ color: "black" }}><b>Select Analysis</b></label>
                        <select
                            style={selectStyle}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setInputValue("");     // RESET INPUT
                                setRecords({});
                            }}
                        >

                            {entity === "Patient" && (
                                <>
                                    <option value="PATIENT_DRUGS">
                                        Patient → Drugs Prescribed
                                    </option>
                                    <option value="PATIENT_DIAGNOSES">
                                        Patient → Diagnoses
                                    </option>
                                    <option value="PATIENT_ADMISSIONS">
                                        Patient → Visits (Admissions)
                                    </option>
                                </>
                            )}

                            {entity === "Diagnosis" && (
                                <>
                                    <option value="DIAG_PATIENTS">
                                        Diagnosis → Patients
                                    </option>
                                </>
                            )}

                            {entity === "Drug" && (
                                <>
                                    <option value="DRUG_PATIENTS">
                                        Drug → Patients Prescribed
                                    </option>
                                </>
                            )}
                            {entity === "Visit" && (
                                <>
                                    <option value="VISIT_DIAGNOSES">
                                        Visit → Diagnoses
                                    </option>
                                    <option value="VISIT_DRUGS">
                                        Visit → Drugs
                                    </option>
                                </>
                            )}
                        </select>
                    </div>
                </div>

                {/* Input */}
                <div style={{ marginTop: "20px" }}>
                    <label style={{ color: "black" }}><b>
                        {entity === "Patient"
                            ? "Select Patient ID"
                            : entity === "Diagnosis"
                                ? "Enter ICD Code"
                                : entity === "Drug"
                                    ? "Enter Drug Name"
                                    : "Select Visit ID"}
                    </b></label>
                    
                    {/* Dropdown for Patient and Visit */}
                    {(entity === "Patient" || entity === "Visit") ? (
                        <select
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            style={selectStyle}
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
                        /* Text input for Diagnosis and Drug */
                        <input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={entity === "Diagnosis" ? "e.g. I10 or 250.00" : "e.g. Furosemide"}
                            style={inputStyle}
                        />
                    )}
                </div>

                {/* Buttons */}
                <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>

                    <button onClick={runQuery} style={runBtn}>
                        Run Query
                    </button>

                    {records.length === 0 && (
                        <p style={{ marginTop: 10, color: "#666" }}>
                            No results yet. Run a query to see output.
                        </p>
                    )}

                    {records.length > 0 && (
                        <p style={{ marginTop: 10, color: "green" }}>
                            {records.length} records fetched ✔
                        </p>
                    )}


                    <button
                        onClick={() => setView("graph")}
                        style={view === "graph" ? activeBtn : toggleBtn}
                    >
                        Graph
                    </button>

                    <button
                        onClick={() => setView("table")}
                        style={view === "table" ? activeBtn : toggleBtn}
                    >
                        Table
                    </button>
                </div>

                {/* Output */}
                <div style={{ marginTop: "30px" }}>
                    {view === "graph" && records.graph && (
                        <div style={{ display: "flex", gap: "20px" }}>
                            {/* Node Properties Panel */}
                            {selectedNode && (
                                <div style={nodePanelStyle}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                                        <h3 style={{ margin: 0, color: "#1f2937", fontSize: "16px" }}>
                                            {selectedNode.group} Properties
                                        </h3>
                                        <button
                                            onClick={() => setSelectedNode(null)}
                                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#6b7280" }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <NodePropertiesPanel node={selectedNode} />
                                </div>
                            )}
                            {/* Graph View */}
                            <div style={{ flex: 1 }}>
                                <GraphView 
                                    graph={records.graph} 
                                    onNodeClick={(node) => setSelectedNode(node)}
                                />
                            </div>
                        </div>
                    )}

                    {view === "table" && records.table && (
                        <TableView rows={records.table} />
                    )}

                </div>
            </div>
        </main>
    );
}

/* ---------- styles ---------- */

const selectStyle = {
    width: "100%",
    padding: "10px",
    marginTop: "6px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#ffffff",
    color: "#000000"
};

const inputStyle = {
    width: "100%",
    padding: "10px",
    marginTop: "6px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#ffffff",
    color: "#000000"
};


const runBtn = {
    padding: "10px 16px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
};

const toggleBtn = {
    padding: "10px 16px",
    backgroundColor: "#e5e7eb",
    color: "#000000",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
};

const activeBtn = {
    ...toggleBtn,
    backgroundColor: "#2563eb",
    color: "#ffffff"
};


const tableStyle = {
    background: "#f9fafb",
    padding: "15px",
    borderRadius: "8px",
    maxHeight: "400px",
    overflow: "auto"
};

const nodePanelStyle = {
    width: "280px",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "15px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    height: "fit-content",
    maxHeight: "500px",
    overflowY: "auto"
};

const propertyRowStyle = {
    display: "flex",
    flexDirection: "column",
    padding: "8px 0",
    borderBottom: "1px solid #f3f4f6"
};

const propertyLabelStyle = {
    fontSize: "12px",
    color: "#6b7280",
    marginBottom: "4px",
    fontWeight: "500"
};

const propertyValueStyle = {
    fontSize: "14px",
    color: "#1f2937",
    wordBreak: "break-word"
};
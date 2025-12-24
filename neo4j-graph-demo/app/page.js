"use client";

import { useState } from "react";
import GraphView from "@/components/GraphView";
import { toGraph } from "@/lib/transform";

export default function Home() {
    const [entity, setEntity] = useState("Patient");
    const [query, setQuery] = useState("PATIENT_DRUGS");
    const [inputValue, setInputValue] = useState("");
    const [records, setRecords] = useState([]);
    const [view, setView] = useState("graph");

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
                            ? "Enter Patient ID"
                            : entity === "Diagnosis"
                                ? "Enter ICD Code"
                                : entity === "Drug"
                                    ? "Enter Drug Name"
                                    : "Enter Visit ID"}
                    </b></label>
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="e.g. PATIENT_10000032"
                        style={inputStyle}
                    />
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
                        <GraphView graph={records.graph} />
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
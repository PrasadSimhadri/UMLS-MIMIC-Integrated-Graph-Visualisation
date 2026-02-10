"use client";

import { useState } from "react";

const CUI_API_BASE = "http://localhost:8000";

export default function CUILookup() {
    const [cui, setCui] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copiedField, setCopiedField] = useState(null);
    const [hoveredExample, setHoveredExample] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!cui.trim()) {
            setError("Please enter a CUI");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch(`${CUI_API_BASE}/api/cui/${cui.trim()}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setError(`CUI "${cui.trim().toUpperCase()}" not found in the database`);
                } else {
                    setError("An error occurred while fetching data");
                }
                return;
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            setError("Failed to connect to the CUI API. Make sure the backend server is running on port 8000.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getFieldColor = (label) => {
        const colors = {
            "Name": "#3b82f6",
            "Node Type": "#8b5cf6",
            "Semantic Types": "#10b981",
            "Canonical Code": "#f59e0b",
            "Sources": "#ec4899",
            "Codes": "#06b6d4",
            "Synonyms": "#6366f1"
        };
        return colors[label] || "#8b5cf6";
    };

    const dataFields = result ? [
        { label: "Name", value: result.data.name },
        { label: "Node Type", value: result.data.node_type },
        { label: "Semantic Types", value: result.data.semantic_types },
        { label: "Canonical Code", value: result.data.canonical_code },
        { label: "Sources", value: result.data.sources },
        { label: "Codes", value: result.data.codes },
        { label: "Synonyms", value: result.data.synonyms },
    ] : [];

    const availableFields = dataFields.filter(f => f.value);
    const unavailableCount = dataFields.filter(f => !f.value).length;

    return (
        <div style={{ animation: "fadeInUp 0.4s ease" }}>
            {/* Search Form */}
            <section className="glass-card hover-lift" style={controlPanelStyle}>
                <div style={headerRow}>
                    <div>
                        <h2 style={sectionTitleStyle}>CUI Lookup</h2>
                        <p style={descriptionStyle}>
                            Search for medical concept identifiers from the UMLS knowledge graph
                        </p>
                    </div>
                    {result && (
                        <button
                            onClick={() => { setResult(null); setCui(""); }}
                            style={clearButtonStyle}
                        >
                            Clear
                        </button>
                    )}
                </div>

                <form onSubmit={handleSearch} style={{ marginTop: "28px" }}>
                    <label style={labelStyle}>
                        Enter CUI (Concept Unique Identifier)
                    </label>
                    <div style={searchContainerStyle}>
                        <input
                            type="text"
                            value={cui}
                            onChange={(e) => setCui(e.target.value.toUpperCase())}
                            placeholder="e.g., C0000005, C0174536"
                            className="input-premium"
                            autoComplete="off"
                            style={{ flex: 1, minWidth: "200px" }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !cui.trim()}
                            className="btn-primary"
                            style={{
                                ...searchButtonStyle,
                                opacity: loading || !cui.trim() ? 0.6 : 1,
                                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)"
                            }}
                        >
                            {loading ? (
                                <>
                                    <span style={spinnerStyle}></span>
                                    Searching...
                                </>
                            ) : (
                                "SEARCH"
                            )}
                        </button>
                    </div>
                </form>
            </section>

            {/* Error Display */}
            {error && (
                <div style={errorCardStyle}>
                    <p style={errorTitleStyle}>Search Error</p>
                    <p style={errorMessageStyle}>{error}</p>
                    <button
                        onClick={() => setError(null)}
                        style={dismissButtonStyle}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Results Display */}
            {result && (
                <section style={resultSectionStyle}>
                    {/* CUI Header Card */}
                    <div className="glass-card" style={headerCardStyle}>
                        <div style={headerContentStyle}>
                            <div>
                                <p style={cuiLabelStyle}>Concept Unique Identifier</p>
                                <div style={cuiValueContainer}>
                                    <p style={cuiValueStyle}>{result.cui}</p>
                                    <button
                                        onClick={() => copyToClipboard(result.cui, 'cui')}
                                        style={{
                                            ...copyButtonStyle,
                                            background: copiedField === 'cui' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.12)',
                                            color: copiedField === 'cui' ? 'white' : '#8b5cf6',
                                            transform: copiedField === 'cui' ? 'scale(0.95)' : 'scale(1)'
                                        }}
                                    >
                                        {copiedField === 'cui' ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                            <div style={statusArea}>
                                <span style={statusBadgeStyle}>
                                    <span style={statusDotStyle}></span>
                                    Found
                                </span>
                                <span style={fieldsCountStyle}>
                                    {availableFields.length} fields available
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Data Fields Grid */}
                    <div style={fieldsGridStyle}>
                        {availableFields.map((field, index) => {
                            const accentColor = getFieldColor(field.label);
                            const isLongValue = field.value && field.value.length > 100;
                            return (
                                <div
                                    key={field.label}
                                    className="hover-lift"
                                    style={{
                                        ...fieldCardStyle,
                                        borderLeftColor: accentColor,
                                        animationDelay: `${index * 0.06}s`,
                                        gridColumn: isLongValue ? "1 / -1" : "auto"
                                    }}
                                >
                                    <div style={fieldHeaderStyle}>
                                        <span style={{ ...fieldLabelStyle, color: accentColor }}>
                                            {field.label}
                                        </span>
                                        <button
                                            onClick={() => copyToClipboard(field.value, field.label)}
                                            style={{
                                                ...fieldCopyButtonStyle,
                                                background: copiedField === field.label ? accentColor : 'transparent',
                                                color: copiedField === field.label ? 'white' : accentColor,
                                                borderColor: copiedField === field.label ? accentColor : `${accentColor}50`
                                            }}
                                        >
                                            {copiedField === field.label ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <p style={{
                                        ...fieldValueStyle,
                                        maxHeight: isLongValue ? "none" : "120px",
                                        overflow: isLongValue ? "visible" : "auto"
                                    }}>
                                        {field.value}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty fields notice */}
                    {unavailableCount > 0 && (
                        <div style={emptyFieldsNotice}>
                            {unavailableCount} field{unavailableCount > 1 ? 's' : ''} not available for this concept
                        </div>
                    )}
                </section>
            )}

            {/* Empty State */}
            {!result && !error && !loading && (
                <div className="glass-card" style={emptyStateContainerStyle}>
                    <div style={emptyStateStyle}>
                        <h3 style={emptyTitleStyle}>Search Medical Concepts</h3>
                        <p style={emptyDescStyle}>
                            Enter a CUI (e.g., C0174536) to look up medical concept information from UMLS.
                        </p>
                        <div style={exampleContainer}>
                            <span style={exampleLabel}>QUICK TRY:</span>
                            <div style={exampleButtonsStyle}>
                                {["C0000005", "C0174536", "C0027051"].map(example => (
                                    <button
                                        key={example}
                                        onClick={() => setCui(example)}
                                        onMouseEnter={() => setHoveredExample(example)}
                                        onMouseLeave={() => setHoveredExample(null)}
                                        style={{
                                            ...exampleButtonStyle,
                                            background: hoveredExample === example 
                                                ? "rgba(139, 92, 246, 0.2)" 
                                                : "rgba(139, 92, 246, 0.08)",
                                            borderColor: hoveredExample === example 
                                                ? "rgba(139, 92, 246, 0.5)" 
                                                : "rgba(139, 92, 246, 0.2)",
                                            transform: hoveredExample === example ? "translateY(-2px)" : "translateY(0)"
                                        }}
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="glass-card" style={loadingContainerStyle}>
                    <div style={loadingSpinnerLarge}></div>
                    <p style={loadingTextStyle}>Searching UMLS database...</p>
                </div>
            )}
        </div>
    );
}

/* ============================================
   STYLES
   ============================================ */

const controlPanelStyle = {
    padding: "32px 36px",
    marginBottom: "24px",
    background: "linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(250,245,255,0.88) 100%)"
};

const headerRow = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap"
};

const sectionTitleStyle = {
    fontSize: "20px",
    fontWeight: "800",
    color: "#3730a3",
    marginBottom: "6px",
    margin: 0
};

const descriptionStyle = {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
    margin: "6px 0 0 0"
};

const clearButtonStyle = {
    padding: "8px 16px",
    background: "transparent",
    border: "2px solid rgba(139, 92, 246, 0.25)",
    borderRadius: "8px",
    color: "#8b5cf6",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s ease"
};

const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "700",
    color: "#6366f1",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px"
};

const searchContainerStyle = {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginTop: "10px"
};

const searchButtonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "8px",
    minWidth: "130px",
    justifyContent: "center",
    transition: "all 0.2s ease"
};

const spinnerStyle = {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
};

const errorCardStyle = {
    padding: "20px 24px",
    marginBottom: "24px",
    background: "linear-gradient(145deg, rgba(254,242,242,0.95) 0%, rgba(254,226,226,0.9) 100%)",
    borderRadius: "16px",
    border: "2px solid rgba(220,38,38,0.15)",
    animation: "fadeInUp 0.3s ease",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
};

const errorTitleStyle = {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    color: "#991b1b"
};

const errorMessageStyle = {
    margin: 0,
    color: "#dc2626",
    fontWeight: "500",
    fontSize: "13px",
    lineHeight: "1.5"
};

const dismissButtonStyle = {
    alignSelf: "flex-start",
    marginTop: "4px",
    padding: "6px 14px",
    background: "rgba(220, 38, 38, 0.1)",
    border: "none",
    borderRadius: "6px",
    color: "#dc2626",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease"
};

const resultSectionStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    animation: "fadeInUp 0.4s ease"
};

const headerCardStyle = {
    padding: "24px 28px",
    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)",
    border: "2px solid rgba(139, 92, 246, 0.15)"
};

const headerContentStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "20px"
};

const cuiLabelStyle = {
    fontSize: "11px",
    color: "#8b5cf6",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1.2px",
    margin: 0
};

const cuiValueContainer = {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginTop: "8px"
};

const cuiValueStyle = {
    fontSize: "28px",
    fontWeight: "800",
    color: "#3730a3",
    margin: 0,
    letterSpacing: "3px",
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace"
};

const copyButtonStyle = {
    border: "none",
    borderRadius: "8px",
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600",
    transition: "all 0.15s ease"
};

const statusArea = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px"
};

const statusBadgeStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    background: "rgba(16, 185, 129, 0.12)",
    borderRadius: "20px",
    border: "1.5px solid rgba(16, 185, 129, 0.2)",
    color: "#059669",
    fontWeight: "700",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
};

const statusDotStyle = {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#10b981"
};

const fieldsCountStyle = {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500"
};

const fieldsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "14px"
};

const fieldCardStyle = {
    padding: "18px 22px",
    borderRadius: "14px",
    background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,245,255,0.92) 100%)",
    border: "1px solid rgba(139, 92, 246, 0.08)",
    borderLeft: "3px solid",
    transition: "all 0.2s ease",
    animation: "fadeInUp 0.4s ease backwards"
};

const fieldHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
};

const fieldLabelStyle = {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.8px"
};

const fieldCopyButtonStyle = {
    border: "1.5px solid",
    borderRadius: "5px",
    padding: "3px 10px",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: "600",
    transition: "all 0.15s ease",
    background: "transparent"
};

const fieldValueStyle = {
    fontSize: "14px",
    color: "#1e1b4b",
    fontWeight: "500",
    wordBreak: "break-word",
    margin: 0,
    lineHeight: "1.65"
};

const emptyFieldsNotice = {
    padding: "12px 18px",
    background: "rgba(100, 116, 139, 0.06)",
    borderRadius: "8px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "500",
    textAlign: "center"
};

const emptyStateContainerStyle = {
    padding: "70px 40px",
    textAlign: "center",
    background: "linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(250,245,255,0.88) 100%)"
};

const emptyStateStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
};

const emptyTitleStyle = {
    fontSize: "20px",
    fontWeight: "800",
    color: "#3730a3",
    margin: "0 0 10px 0"
};

const emptyDescStyle = {
    fontSize: "15px",
    color: "#64748b",
    maxWidth: "420px",
    lineHeight: "1.6",
    fontWeight: "500",
    margin: "0 0 24px 0"
};

const exampleContainer = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "14px"
};

const exampleLabel = {
    fontSize: "12px",
    color: "#8b5cf6",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.8px"
};

const exampleButtonsStyle = {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    justifyContent: "center"
};

const exampleButtonStyle = {
    padding: "10px 18px",
    background: "rgba(139, 92, 246, 0.08)",
    border: "2px solid rgba(139, 92, 246, 0.2)",
    borderRadius: "10px",
    color: "#6366f1",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace"
};

const loadingContainerStyle = {
    padding: "60px 40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
    background: "linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(250,245,255,0.88) 100%)"
};

const loadingSpinnerLarge = {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(139, 92, 246, 0.15)",
    borderTopColor: "#8b5cf6",
    borderRadius: "50%",
    animation: "spin 0.9s linear infinite"
};

const loadingTextStyle = {
    margin: 0,
    fontSize: "15px",
    color: "#8b5cf6",
    fontWeight: "600"
};

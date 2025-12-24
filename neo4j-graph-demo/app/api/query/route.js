import neo4j from "neo4j-driver";
import { queries } from "@/lib/queries";

const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(
        process.env.NEO4J_USER,
        process.env.NEO4J_PASSWORD
    )
);

export async function POST(req) {
    const { queryType, params } = await req.json();

    const session = driver.session();
    const queryDef = queries[queryType];

    if (!queryDef) {
        return Response.json(
            { error: "Invalid query type" },
            { status: 400 }
        );
    }

    const result = await session.run(
        queryDef.cypher,
        { [queryDef.param]: params[queryDef.param] }
    );
    await session.close();

    const nodes = {};
    const edges = [];
    const rows = [];
    
    // Map Neo4j internal node IDs to our node IDs
    const nodeIdMap = {};

    result.records.forEach(record => {
        const row = {};
        const recordNodeIds = []; // Track node IDs for VISIT_DRUGS fallback

        record.keys.forEach(key => {
            const value = record.get(key);

            // ---------- NODE ----------
            if (value && value.labels) {
                const nodeType = value.labels[0];
                const props = value.properties;

                // Get display name based on node type
                const displayName = 
                    props.name || 
                    props.icd_code ||   // Check icd_code BEFORE id
                    props.id || 
                    props.title ||
                    `${nodeType}_${value.identity.toString()}`;

                // Canonical ID for edges
                const nodeId = 
                    props.icd_code ||   // Check icd_code BEFORE id
                    props.id || 
                    props.name ||
                    value.identity.toString();

                // Map Neo4j internal ID to our node ID
                nodeIdMap[value.identity.toString()] = nodeId;

                // Track nodes for VISIT_DRUGS
                recordNodeIds.push(nodeId);

                // Convert Neo4j Integer values to regular numbers
                const cleanProps = {};
                Object.keys(props).forEach(k => {
                    const v = props[k];
                    cleanProps[k] = neo4j.isInt(v) ? v.toNumber() : v;
                });

                nodes[nodeId] = {
                    id: nodeId,
                    label: displayName,
                    group: nodeType,
                    title: `${nodeType}: ${displayName}`,
                    properties: cleanProps  // Include all node properties
                };

                // Table row
                row[nodeType] = displayName;
            }

            // ---------- RELATIONSHIP ----------
            if (value && value.type && value.start && value.end) {
                // Store relationship info temporarily - we'll resolve IDs after processing all nodes
                const relStartId = value.start.toString();
                const relEndId = value.end.toString();
                
                edges.push({
                    _startIdentity: relStartId,
                    _endIdentity: relEndId,
                    label: value.type
                });
            }
        });

        // Special case: VISIT_DRUGS - create direct edge between Encounter and Drug
        if (queryType === "VISIT_DRUGS" && recordNodeIds.length === 2) {
            edges.push({
                _direct: true,
                from: recordNodeIds[0],
                to: recordNodeIds[1],
                label: "PRESCRIBED"
            });
        }

        rows.push(row);
    });

    // Resolve edge node IDs using the nodeIdMap
    const resolvedEdges = edges.map(edge => {
        // Direct edges (for VISIT_DRUGS)
        if (edge._direct) {
            return {
                from: edge.from,
                to: edge.to,
                label: edge.label
            };
        }
        return {
            from: nodeIdMap[edge._startIdentity] || edge._startIdentity,
            to: nodeIdMap[edge._endIdentity] || edge._endIdentity,
            label: edge.label
        };
    });

    // Remove duplicate edges and filter invalid ones
    const uniqueEdges = [];
    const edgeSet = new Set();
    resolvedEdges.forEach(edge => {
        // Skip edges where endpoints don't exist in nodes
        if (!nodes[edge.from] || !nodes[edge.to]) return;

        const edgeKey = `${edge.from}-${edge.label}-${edge.to}`;
        if (!edgeSet.has(edgeKey)) {
            edgeSet.add(edgeKey);
            uniqueEdges.push(edge);
        }
    });

    // console.log("NODES:", Object.values(nodes));
    // console.log("EDGES:", uniqueEdges);

    return Response.json({
        graph: {
            nodes: Object.values(nodes),
            edges: uniqueEdges
        },
        table: rows
    });
}
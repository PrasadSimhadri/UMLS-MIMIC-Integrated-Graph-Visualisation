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

    result.records.forEach(record => {
        const row = {};

        record.keys.forEach(key => {
            const value = record.get(key);

            // -------- NODE --------
            if (value?.labels) {
                const label = value.labels[0];
                const id =
                    value.properties.id ||
                    value.properties.icd_code ||
                    value.properties.name;

                nodes[id] = {
                    id,
                    label,
                    name:
                        value.properties.name ||
                        value.properties.icd_code ||
                        value.properties.id
                };

                row[label] =
                    value.properties.name ||
                    value.properties.icd_code ||
                    value.properties.id;
            }

            // -------- RELATIONSHIP --------
            if (value?.type) {
                edges.push({
                    from: value.start.toString(),
                    to: value.end.toString(),
                    label: value.type
                });
            }
        });

        rows.push(row);
    });

    return Response.json({
        graph: {
            nodes: Object.values(nodes),
            edges
        },
        table: rows
    });
}
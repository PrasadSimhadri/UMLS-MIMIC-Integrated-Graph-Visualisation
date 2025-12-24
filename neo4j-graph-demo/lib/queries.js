export const queries = {

    // LIST ALL IDs - for dropdowns
    ALL_PATIENTS: {
        cypher: `MATCH (p:Patient) RETURN p.id AS id ORDER BY p.id LIMIT 100`,
        param: null
    },

    ALL_VISITS: {
        cypher: `MATCH (e:Encounter) RETURN e.id AS id ORDER BY e.id LIMIT 10`,
        param: null
    },

    // PATIENT QUERIES - PATIENT_10000032
    PATIENT_DRUGS: {
        cypher: `
        MATCH (p:Patient {id:$id})-[r:PRESCRIBED]->(d:Drug)
        WITH p, d, collect(r)[0] AS rel
        RETURN p, rel, d LIMIT 10
        `,
        param: "id"
    },

    PATIENT_DIAGNOSES: {
        cypher: `
        MATCH (p:Patient {id:$id})-[r:DIAGNOSED_AS]->(d:Diagnosis)
        WITH p, d, collect(r)[0] AS rel
        RETURN p, rel, d LIMIT 10
        `,
        param: "id"
    },

    PATIENT_ADMISSIONS: {
        cypher: `
        MATCH (p:Patient {id:$id})-[r:ADMITTED]->(e:Encounter)
        WITH p, e, collect(r)[0] AS rel
        RETURN p, rel, e
        `,
        param: "id"
    },


    // DIAGNOSIS QUERIES - I10 or 250.00
    DIAG_PATIENTS: {
        cypher: `
        MATCH (p:Patient)-[r:DIAGNOSED_AS]->(d:Diagnosis {icd_code:$icd})
        // Group by Patient and Diagnosis to remove duplicate edges
        WITH p, d, collect(r)[0] AS rel
        RETURN p, rel, d LIMIT 50
        `,
        param: "icd"
    },

    // DRUG QUERIES - Furosemide
    DRUG_PATIENTS: {
        cypher: `
      MATCH (p:Patient)-[r:PRESCRIBED]->(d:Drug {name:$drug})
      RETURN p, r, d
    `,
        param: "drug"
    },

    // VISIT QUERIES - ENCOUNTER_22841357
    VISIT_DIAGNOSES: {
        cypher: `
    MATCH (e:Encounter {id:$visit})-[r:DIAGNOSED]->(d:Diagnosis)
    WITH e, d, collect(r)[0] AS rel
    RETURN e, rel, d
  `,
        param: "visit"
    },

    VISIT_DRUGS: {
        cypher: `
    MATCH (e:Encounter {id:$visit})
      -[:DIAGNOSED]->(:Diagnosis)
      -[r:PRESCRIBED_FOR]->(d:Drug)
      WITH e, d, collect(r)[0] AS rel
    RETURN DISTINCT e,rel, d LIMIT 10
  `,
        param: "visit"
    }

};


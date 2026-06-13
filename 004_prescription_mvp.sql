-- 002_drug_search_rpc.sql

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes for Fast Search
CREATE INDEX idx_brand_name_trgm ON brand_master USING GIN (brand_name gin_trgm_ops);
CREATE INDEX idx_generic_name_trgm ON generic_master USING GIN (generic_name_normalized gin_trgm_ops);
CREATE INDEX idx_brand_name ON brand_master(brand_name);

-- Search RPC Function
CREATE OR REPLACE FUNCTION search_medicines(
    search_term TEXT,
    p_clinic_id UUID DEFAULT NULL,
    p_doctor_id UUID DEFAULT NULL
) 
RETURNS TABLE (
    id UUID,
    brand_id UUID,
    generic_id UUID,
    brand_name TEXT,
    generic_name TEXT,
    dosage_form TEXT,
    dosage_form_id UUID,
    strength TEXT,
    strength_id UUID,
    route TEXT,
    route_id UUID,
    match_score FLOAT,
    rank_weight FLOAT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH Matches AS (
        -- Match on Brands
        SELECT 
            bgm.id,
            b.id AS brand_id,
            g.id AS generic_id,
            b.brand_name,
            g.generic_name_raw AS generic_name,
            df.name AS dosage_form,
            df.id AS dosage_form_id,
            s.value || s.uom AS strength,
            s.id AS strength_id,
            r.name AS route,
            r.id AS route_id,
            GREATEST(similarity(b.brand_name, search_term), similarity(g.generic_name_normalized, search_term)) AS match_score,
            CASE 
                WHEN doc_fav.id IS NOT NULL THEN 4.0 -- Doctor Favorite
                WHEN clin_pref.id IS NOT NULL THEN 3.0 -- Clinic Preferred
                ELSE 1.0 + LEAST(b.global_prescription_count / 1000.0, 1.0) -- Popularity
            END AS rank_weight
        FROM brand_master b
        JOIN brand_generic_mapping bgm ON b.id = bgm.brand_id
        JOIN generic_master g ON bgm.generic_id = g.id
        LEFT JOIN dosage_form_master df ON bgm.dosage_form_id = df.id OR g.dosage_form_id = df.id
        LEFT JOIN strength_master s ON bgm.strength_id = s.id
        LEFT JOIN route_master r ON bgm.route_id = r.id
        LEFT JOIN doctor_favorites doc_fav ON b.id = doc_fav.brand_id AND doc_fav.doctor_id = p_doctor_id
        LEFT JOIN clinic_preferences clin_pref ON b.id = clin_pref.brand_id AND clin_pref.clinic_id = p_clinic_id
        WHERE 
            b.brand_name ILIKE search_term || '%' OR
            g.generic_name_normalized ILIKE search_term || '%' OR
            b.brand_name % search_term OR 
            g.generic_name_normalized % search_term

        UNION
        
        -- Match purely on Generics (if no brands exist or user searches generic directly)
        SELECT 
            g.id AS id,
            NULL::UUID AS brand_id,
            g.id AS generic_id,
            NULL::TEXT AS brand_name,
            g.generic_name_raw AS generic_name,
            df.name AS dosage_form,
            df.id AS dosage_form_id,
            NULL::TEXT AS strength,
            NULL::UUID AS strength_id,
            NULL::TEXT AS route,
            NULL::UUID AS route_id,
            similarity(g.generic_name_normalized, search_term) AS match_score,
            CASE 
                WHEN doc_fav.id IS NOT NULL THEN 4.0
                WHEN clin_pref.id IS NOT NULL THEN 3.0
                ELSE 1.0
            END AS rank_weight
        FROM generic_master g
        LEFT JOIN dosage_form_master df ON g.dosage_form_id = df.id
        LEFT JOIN doctor_favorites doc_fav ON g.id = doc_fav.generic_id AND doc_fav.doctor_id = p_doctor_id
        LEFT JOIN clinic_preferences clin_pref ON g.id = clin_pref.generic_id AND clin_pref.clinic_id = p_clinic_id
        WHERE 
            g.generic_name_normalized ILIKE search_term || '%' OR
            g.generic_name_normalized % search_term
    )
    SELECT * FROM Matches 
    ORDER BY rank_weight DESC, match_score DESC 
    LIMIT 50;
END;
$$;

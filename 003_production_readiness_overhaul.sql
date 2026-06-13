-- 001_drug_master_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core Reference Masters
CREATE TABLE drug_group_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE dosage_form_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE route_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE strength_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    value VARCHAR(50) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    UNIQUE(value, uom)
);

CREATE TABLE manufacturer_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Generic Master
CREATE TABLE generic_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_group_id UUID REFERENCES drug_group_master(id),
    dosage_form_id UUID REFERENCES dosage_form_master(id),
    generic_name_raw TEXT NOT NULL,
    generic_name_normalized TEXT NOT NULL UNIQUE,
    extraction_confidence VARCHAR(20) DEFAULT 'Low' -- High, Medium, Low
);

-- Brand Master
CREATE TABLE brand_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manufacturer_id UUID REFERENCES manufacturer_master(id),
    brand_name TEXT NOT NULL UNIQUE,
    global_prescription_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- Brand-Generic Mapping (Combinations)
CREATE TABLE brand_generic_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brand_master(id) ON DELETE CASCADE,
    generic_id UUID REFERENCES generic_master(id) ON DELETE CASCADE,
    strength_id UUID REFERENCES strength_master(id),
    dosage_form_id UUID REFERENCES dosage_form_master(id),
    route_id UUID REFERENCES route_master(id)
);

-- Doctor Favorites
CREATE TABLE doctor_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL, -- Ties to Supabase Auth User ID or Doctor Profile
    brand_id UUID REFERENCES brand_master(id),
    generic_id UUID REFERENCES generic_master(id), -- Nullable, if favoring a generic
    default_route VARCHAR(50),
    default_frequency VARCHAR(50),
    default_duration VARCHAR(50),
    default_instructions TEXT,
    UNIQUE(doctor_id, brand_id, generic_id)
);

-- Clinic Preferences
CREATE TABLE clinic_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID NOT NULL,
    brand_id UUID REFERENCES brand_master(id),
    generic_id UUID REFERENCES generic_master(id),
    is_preferred BOOLEAN DEFAULT TRUE,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    UNIQUE(clinic_id, brand_id, generic_id)
);

-- Enable RLS
ALTER TABLE drug_group_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE dosage_form_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE strength_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturer_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE generic_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_generic_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Public Read for Masters, Admin Write)
CREATE POLICY "Public read access for masters" ON drug_group_master FOR SELECT USING (true);
CREATE POLICY "Public read access for masters" ON dosage_form_master FOR SELECT USING (true);
CREATE POLICY "Public read access for masters" ON route_master FOR SELECT USING (true);
CREATE POLICY "Public read access for masters" ON strength_master FOR SELECT USING (true);
CREATE POLICY "Public read access for masters" ON manufacturer_master FOR SELECT USING (true);
CREATE POLICY "Public read access for masters" ON generic_master FOR SELECT USING (true);
CREATE POLICY "Public read access for masters" ON brand_master FOR SELECT USING (true);
CREATE POLICY "Public read access for masters" ON brand_generic_mapping FOR SELECT USING (true);

-- RLS Policies for Tenant Isolation (Favorites & Preferences)
-- Doctors can only read/write their own favorites
CREATE POLICY "Doctors manage their own favorites" ON doctor_favorites
    USING (auth.uid() = doctor_id);

-- Clinics manage their own preferences
CREATE POLICY "Clinics read their preferences" ON clinic_preferences
    FOR SELECT USING (true); -- Usually restricted via jwt claims

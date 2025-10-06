-- Migration: Ajout de la table informations_enrichies liée à prospects
CREATE TABLE informations_enrichies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id uuid REFERENCES prospects(id) ON DELETE CASCADE,
    social_media JSON ,
    audit_seo JSON ,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour accélérer les requêtes sur la clé étrangère
CREATE INDEX idx_informations_enrichies_prospect_id ON informations_enrichies(prospect_id);

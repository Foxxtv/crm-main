/*
  # Mise à jour de la table prospects

  1. Modifications
    - Suppression des anciens champs (email, company, status, source, notes, value, assigned_to)
    - Ajout des nouveaux champs requis :
      - `nom` (text, obligatoire)
      - `telephone` (text, optionnel)
      - `adresse` (text, optionnel)
      - `site_web` (text, optionnel)
      - `score_seo` (integer, optionnel, entre 0 et 100)
      - `message_personnalise` (text, optionnel)

  2. Sécurité
    - Maintien des politiques RLS existantes
    - Conservation des contraintes de base
*/

-- Supprimer les anciennes colonnes
ALTER TABLE prospects DROP COLUMN IF EXISTS email;
ALTER TABLE prospects DROP COLUMN IF EXISTS company;
ALTER TABLE prospects DROP COLUMN IF EXISTS status;
ALTER TABLE prospects DROP COLUMN IF EXISTS source;
ALTER TABLE prospects DROP COLUMN IF EXISTS notes;
ALTER TABLE prospects DROP COLUMN IF EXISTS value;
ALTER TABLE prospects DROP COLUMN IF EXISTS assigned_to;

-- Renommer la colonne name en nom
ALTER TABLE prospects RENAME COLUMN name TO nom;

-- Ajouter les nouvelles colonnes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospects' AND column_name = 'telephone'
  ) THEN
    ALTER TABLE prospects ADD COLUMN telephone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospects' AND column_name = 'adresse'
  ) THEN
    ALTER TABLE prospects ADD COLUMN adresse text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospects' AND column_name = 'site_web'
  ) THEN
    ALTER TABLE prospects ADD COLUMN site_web text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospects' AND column_name = 'score_seo'
  ) THEN
    ALTER TABLE prospects ADD COLUMN score_seo integer CHECK (score_seo >= 0 AND score_seo <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospects' AND column_name = 'message_personnalise'
  ) THEN
    ALTER TABLE prospects ADD COLUMN message_personnalise text;
  END IF;
END $$;

-- Supprimer l'ancienne contrainte de statut si elle existe
ALTER TABLE prospects DROP CONSTRAINT IF EXISTS prospects_status_check;

-- Supprimer les anciens index qui ne sont plus nécessaires
DROP INDEX IF EXISTS prospects_status_idx;
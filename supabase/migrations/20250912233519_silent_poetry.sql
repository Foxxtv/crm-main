/*
  # Create prospects table for CRM

  1. New Tables
    - `prospects`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, required)
      - `phone` (text, optional)
      - `company` (text, optional)
      - `status` (text, required, with check constraint)
      - `source` (text, optional)
      - `notes` (text, optional)
      - `value` (numeric, optional)
      - `assigned_to` (text, optional)
      - `user_id` (uuid, required, foreign key to auth.users)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `prospects` table
    - Add policies for authenticated users to manage their own prospects
*/

CREATE TABLE IF NOT EXISTS prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'qualified', 'contacted', 'converted', 'lost')),
  source text,
  notes text,
  value numeric,
  assigned_to text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

-- Create policies for prospects table
CREATE POLICY "Users can view their own prospects"
  ON prospects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prospects"
  ON prospects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own prospects"
  ON prospects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prospects"
  ON prospects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS prospects_user_id_idx ON prospects(user_id);
CREATE INDEX IF NOT EXISTS prospects_status_idx ON prospects(status);
CREATE INDEX IF NOT EXISTS prospects_created_at_idx ON prospects(created_at DESC);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
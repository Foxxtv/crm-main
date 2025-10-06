/*
  # Create custom_tables for dynamic table management

  1. New Tables
    - `custom_tables`
      - `id` (uuid, primary key)
      - `name` (text, required, unique per user)
      - `schema` (jsonb, required)
      - `user_id` (uuid, required, foreign key to auth.users)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `custom_tables` table
    - Add policies for authenticated users to manage their own custom tables
*/

CREATE TABLE IF NOT EXISTS custom_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  schema jsonb NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, user_id)
);

-- Enable Row Level Security
ALTER TABLE custom_tables ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_tables table
CREATE POLICY "Users can view their own custom tables"
  ON custom_tables
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom tables"
  ON custom_tables
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom tables"
  ON custom_tables
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom tables"
  ON custom_tables
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS custom_tables_user_id_idx ON custom_tables(user_id);
CREATE INDEX IF NOT EXISTS custom_tables_name_idx ON custom_tables(name);

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_custom_tables_updated_at
  BEFORE UPDATE ON custom_tables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
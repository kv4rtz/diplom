import { Sequelize } from 'sequelize';

export const generateIdFnPlpgsql = async (connection: Sequelize) => {
  await connection.query(`
CREATE OR REPLACE FUNCTION generate_custom_id()
RETURNS text AS $$
DECLARE
		chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		result TEXT := '';
BEGIN
		FOR i IN 1..8 LOOP
				result := result || substr(chars, (floor(random() * length(chars)) + 1)::int, 1);
		END LOOP;
		RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_unique_id_for_table(table_name TEXT)
RETURNS text AS $$
DECLARE
		new_id TEXT;
		sql TEXT;
		exists_count INT;
BEGIN
		LOOP
				new_id := generate_custom_id();

				sql := format('SELECT COUNT(1) FROM %I WHERE id = $1', table_name);
				EXECUTE sql INTO exists_count USING new_id;

				EXIT WHEN exists_count = 0;
		END LOOP;

		RETURN new_id;
END;
$$ LANGUAGE plpgsql;
            `);
};

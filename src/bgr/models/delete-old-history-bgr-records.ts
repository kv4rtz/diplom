import { Sequelize } from 'sequelize';

export const deleteOldHistoryBgrRecordsFnPlpgsql = async (
  connection: Sequelize,
  tableName: string,
) => {
  await connection.query(`
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM ${tableName} 
  WHERE "createdAt" < NOW() - INTERVAL '60 days';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER cleanup_trigger
AFTER INSERT ON ${tableName}
FOR EACH ROW
EXECUTE FUNCTION cleanup_old_records();
    `);
};

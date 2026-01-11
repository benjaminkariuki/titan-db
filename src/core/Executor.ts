import { Database } from './Database';
import { type ColumnSchema, type QueryResult, type Row, type RowValue } from './types';

// Helper to strip quotes from strings like "'value'" -> "value"
const cleanStr = (str: string) => str.replace(/^['"]|['"]$/g, '');

// Helper to parse value to correct type (number vs string vs boolean)
const parseValue = (val: string): RowValue => {
  const v = val.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (!isNaN(Number(v))) return Number(v);
  return cleanStr(v);
};

export const executeSQL = (db: Database, query: string): QueryResult<any> => {
  const q = query.trim();

  try {
    // ---------------------------------------------------------
    // 1. CREATE TABLE
    // Syntax: CREATE TABLE users (id NUMBER PK, name STRING, active BOOLEAN)
    // ---------------------------------------------------------
    if (/^CREATE TABLE/i.test(q)) {
      const match = q.match(/CREATE TABLE (\w+)\s*\((.+)\)/i);
      if (!match) throw new Error("Syntax Error: CREATE TABLE table_name (col type, ...)");
      
      const tableName = match[1];
      const columnsRaw = match[2].split(',');
      
      const columns: ColumnSchema[] = columnsRaw.map(c => {
        const parts = c.trim().split(/\s+/); // Split by spaces
        const name = parts[0];
        const typeRaw = parts[1].toUpperCase();
        
        // Validate Type
        if (!['STRING', 'NUMBER', 'BOOLEAN'].includes(typeRaw)) {
          throw new Error(`Invalid type '${typeRaw}' for column '${name}'`);
        }

        return {
          name: name,
          type: typeRaw as any,
          isPrimaryKey: parts.includes('PK'),
          isUnique: parts.includes('UNIQUE')
        };
      });

      return db.createTable(tableName, columns);
    }

    // ---------------------------------------------------------
    // 2. INSERT (Hybrid Syntax)
    // Syntax: INSERT INTO users { "id": 1, "name": "Vic" }
    // ---------------------------------------------------------
    if (/^INSERT INTO/i.test(q)) {
      const match = q.match(/INSERT INTO (\w+)\s+(.+)/i);
      if (!match) throw new Error("Syntax Error: INSERT INTO table_name { json_object }");
      
      const tableName = match[1];
      let data: Row;

      try {
        // We use JSON.parse for robustness instead of writing a custom value tokenizer
        data = JSON.parse(match[2]); 
      } catch (e) {
        throw new Error("Syntax Error: Data must be a valid JSON object. E.g., { \"id\": 1 }");
      }

      return db.insert(tableName, data);
    }

    // ---------------------------------------------------------
    // 3. SELECT (With WHERE and JOIN)
    // Syntax: SELECT * FROM users WHERE id=1 JOIN orders ON user_id=id
    // ---------------------------------------------------------
    if (/^SELECT/i.test(q)) {
      // 1. Extract Table Name
      const tableMatch = q.match(/FROM\s+(\w+)/i);
      if (!tableMatch) throw new Error("Syntax Error: Missing FROM clause");
      const tableName = tableMatch[1];

      // 2. Extract WHERE clause (Optional)
      let where = undefined;
      const whereMatch = q.match(/WHERE\s+(\w+)\s*(=|!=)\s*([^ ]+)/i); // Simple comparison
      if (whereMatch) {
        where = {
          col: whereMatch[1],
          val: parseValue(whereMatch[3])
        };
      }

      // 3. Extract JOIN clause (Optional)
      // Syntax: JOIN targetTable ON myCol=targetCol
      let join = undefined;
      const joinMatch = q.match(/JOIN\s+(\w+)\s+ON\s+(\w+)\s*=\s*(\w+)/i);
      if (joinMatch) {
        join = {
          targetTable: joinMatch[1],
          onLeft: joinMatch[2],
          onRight: joinMatch[3]
        };
      }

      return db.select(tableName, where, join);
    }

    // ---------------------------------------------------------
    // 4. UPDATE
    // Syntax: UPDATE users SET { "name": "New" } WHERE id=1
    // ---------------------------------------------------------
    if (/^UPDATE/i.test(q)) {
      const match = q.match(/UPDATE\s+(\w+)\s+SET\s+(.+)\s+WHERE\s+(\w+)\s*=\s*([^ ]+)/i);
      if (!match) throw new Error("Syntax Error: UPDATE table SET {json} WHERE col=val");

      const tableName = match[1];
      const whereCol = match[3];
      const whereVal = parseValue(match[4]);
      let newData: Partial<Row>;

      try {
        newData = JSON.parse(match[2]);
      } catch (e) {
        throw new Error("Syntax Error: SET value must be valid JSON.");
      }

      return db.update(tableName, { col: whereCol, val: whereVal }, newData);
    }

    // ---------------------------------------------------------
    // 5. DELETE
    // Syntax: DELETE FROM users WHERE id=1
    // ---------------------------------------------------------
    if (/^DELETE FROM/i.test(q)) {
      const match = q.match(/DELETE FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*([^ ]+)/i);
      if (!match) throw new Error("Syntax Error: DELETE FROM table WHERE col=val");

      const tableName = match[1];
      const whereCol = match[2];
      const whereVal = parseValue(match[3]);

      return db.delete(tableName, { col: whereCol, val: whereVal });
    }

    throw new Error("Unknown Command. Supported: CREATE, INSERT, SELECT, UPDATE, DELETE");

  } catch (err: any) {
    return { success: false, message: err.message };
  }
};
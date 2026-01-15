import { DBMS } from './DBMS';
import { Database } from './Database';
import type { ColumnSchema, QueryResult, Row, RowValue } from './types';

// Helper: Strip quotes
const cleanStr = (str: string) => str.replace(/^['"]|['"]$/g, '');

// Helper: Parse value
const parseValue = (val: string): RowValue => {
  const v = val.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (!isNaN(Number(v))) return Number(v);
  return cleanStr(v);
};

// FIX: Now accepts DBMS and currentDbName instead of just a Database instance
export const executeSQL = (dbms: DBMS, currentDbName: string, query: string): QueryResult<any> => {
  const q = query.trim();

  try {
    // ---------------------------------------------------------
    // NEW 0. DBMS Commands (CREATE DATABASE / USE)
    // ---------------------------------------------------------
    if (/^CREATE DATABASE/i.test(q)) {
      const match = q.match(/CREATE DATABASE\s+(\w+)/i);
      if (!match) throw new Error("Syntax: CREATE DATABASE name");
      return dbms.createDatabase(match[1]);
    }

    if (/^USE/i.test(q)) {
      const match = q.match(/USE\s+(\w+)/i);
      if (!match) throw new Error("Syntax: USE name");
      const targetDb = match[1];
      
      // Check if it exists (throws if not)
      dbms.getDatabase(targetDb); 
      
      return { success: true, message: `Switched to database '${targetDb}'`, newActiveDb: targetDb };
    }

    // ---------------------------------------------------------
    // Standard SQL (Execute on the CURRENT Database)
    // ---------------------------------------------------------
    const db = dbms.getDatabase(currentDbName);

    // 1. CREATE TABLE
    if (/^CREATE TABLE/i.test(q)) {
      const match = q.match(/CREATE TABLE (\w+)\s*\((.+)\)/i);
      if (!match) throw new Error("Syntax Error: CREATE TABLE table_name (col type, ...)");
      
      const tableName = match[1];
      const columnsRaw = match[2].split(',');
      
      const columns: ColumnSchema[] = columnsRaw.map(c => {
        const parts = c.trim().split(/\s+/);
        return {
          name: parts[0],
          type: parts[1].toUpperCase() as any,
          isPrimaryKey: parts.includes('PK'),
          isUnique: parts.includes('UNIQUE')
        };
      });

      return db.createTable(tableName, columns);
    }

    // 2. INSERT
    if (/^INSERT INTO/i.test(q)) {
      const match = q.match(/INSERT INTO (\w+)\s+(.+)/i);
      if (!match) throw new Error("Syntax Error: INSERT INTO table {json}");
      try {
        return db.insert(match[1], JSON.parse(match[2]));
      } catch (e) {
        throw new Error("Invalid JSON data");
      }
    }

    // 3. SELECT
    if (/^SELECT/i.test(q)) {
      const tableMatch = q.match(/FROM\s+(\w+)/i);
      if (!tableMatch) throw new Error("Syntax Error: Missing FROM");
      const tableName = tableMatch[1];

      let where = undefined;
      const whereMatch = q.match(/WHERE\s+(\w+)\s*(=|!=)\s*([^ ]+)/i);
      if (whereMatch) where = { col: whereMatch[1], val: parseValue(whereMatch[3]) };

      let join = undefined;
      const joinMatch = q.match(/JOIN\s+(\w+)\s+ON\s+(\w+)\s*=\s*(\w+)/i);
      if (joinMatch) join = { targetTable: joinMatch[1], onLeft: joinMatch[2], onRight: joinMatch[3] };

      return db.select(tableName, where, join);
    }

    // 4. UPDATE
    if (/^UPDATE/i.test(q)) {
      const match = q.match(/UPDATE\s+(\w+)\s+SET\s+(.+)\s+WHERE\s+(\w+)\s*=\s*([^ ]+)/i);
      if (!match) throw new Error("Syntax: UPDATE table SET {json} WHERE col=val");
      
      try {
        const newData = JSON.parse(match[2]);
        return db.update(match[1], { col: match[3], val: parseValue(match[4]) }, newData);
      } catch (e) { throw new Error("Invalid JSON for SET"); }
    }

    // 5. DELETE
    if (/^DELETE FROM/i.test(q)) {
      const match = q.match(/DELETE FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*([^ ]+)/i);
      if (!match) throw new Error("Syntax: DELETE FROM table WHERE col=val");
      return db.delete(match[1], { col: match[2], val: parseValue(match[3]) });
    }

    throw new Error("Unknown Command.");

  } catch (err: any) {
    return { success: false, message: err.message };
  }
};
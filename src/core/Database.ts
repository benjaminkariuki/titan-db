import { type ColumnSchema, type JoinClause, type QueryResult, type Row, type WhereClause } from './types';
import { Table } from './Table';

export class Database {
  private tables: Map<string, Table>;

  constructor() {
    this.tables = new Map();
  }

  public createTable(name: string, columns: ColumnSchema[]): QueryResult<null> {
    if (this.tables.has(name)) return { success: false, message: `Table '${name}' exists.` };
    
    // Strict PK check
    if (columns.filter(c => c.isPrimaryKey).length !== 1) {
      return { success: false, message: "Table must have exactly one Primary Key." };
    }

    this.tables.set(name, new Table(name, columns));
    return { success: true, message: `Table '${name}' created.` };
  }

  // --- INSERT ---
  public insert(tableName: string, row: Row): QueryResult<null> {
    const table = this.tables.get(tableName);
    if (!table) return { success: false, message: `Table '${tableName}' not found.` };

    try {
      table.insert(row);
      return { success: true, message: "Row inserted." };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // --- SELECT (With JOIN and WHERE) ---
  public select(
    tableName: string, 
    where?: WhereClause, 
    join?: JoinClause
  ): QueryResult<Row[]> {
    const table = this.tables.get(tableName);
    if (!table) return { success: false, message: `Table '${tableName}' not found.` };

    let results = table.selectAll(where);

    // JOIN LOGIC (Simple Nested Loop Join)
    if (join) {
      const rightTable = this.tables.get(join.targetTable);
      if (!rightTable) return { success: false, message: `Join table '${join.targetTable}' not found.` };

      const joinedData: Row[] = [];

      // Iterate over left results
      results.forEach(leftRow => {
        // Find matches in right table (Full scan of right table for matches)
        // Optimization: In a real DB, we would use an index on the right table here.
        rightTable.data.forEach(rightRow => {
          if (String(leftRow[join.onLeft]) === String(rightRow[join.onRight])) {
            // Merge rows (Left overwrites Right on collision in this simple version)
            joinedData.push({ ...rightRow, ...leftRow }); 
          }
        });
      });

      results = joinedData;
    }

    return { success: true, data: results };
  }

  // --- UPDATE ---
  public update(tableName: string, where: WhereClause, newData: Partial<Row>): QueryResult<null> {
    const table = this.tables.get(tableName);
    if (!table) return { success: false, message: `Table '${tableName}' not found.` };

    try {
      const count = table.update(where, newData);
      return { success: true, message: `${count} row(s) updated.` };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }

  // --- DELETE ---
  public delete(tableName: string, where: WhereClause): QueryResult<null> {
    const table = this.tables.get(tableName);
    if (!table) return { success: false, message: `Table '${tableName}' not found.` };

    const count = table.delete(where);
    return { success: true, message: `${count} row(s) deleted.` };
  }
}
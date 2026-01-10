import { type ColumnSchema, type Row, type RowValue, type TableSchema, type WhereClause } from './types';

export class Table {
  public schema: TableSchema;
  public data: Map<RowValue, Row>; // Public so Database can access for Joins
  private indices: Map<string, Map<RowValue, RowValue>>; 
  private autoIncrement: number;

  constructor(name: string, columns: ColumnSchema[]) {
    this.schema = { name, columns };
    this.data = new Map();
    this.indices = new Map();
    this.autoIncrement = 1;

    columns.forEach(col => {
      if (col.isUnique) {
        this.indices.set(col.name, new Map());
      }
    });
  }

  getPrimaryKeyColumn(): ColumnSchema {
    return this.schema.columns.find(c => c.isPrimaryKey) || this.schema.columns[0];
  }

  // --- CREATE ---
  insert(row: Row): void {
    const pkCol = this.getPrimaryKeyColumn();
    const finalRow = { ...row };

    // Auto-Increment
    if (finalRow[pkCol.name] === undefined && pkCol.type === 'NUMBER') {
      finalRow[pkCol.name] = this.autoIncrement++;
    }

    const pkValue = finalRow[pkCol.name];

    // Check PK
    if (this.data.has(pkValue)) {
      throw new Error(`Duplicate Primary Key: ${pkValue}`);
    }

    // Check Unique Constraints
    for (const col of this.schema.columns) {
      if (col.isUnique && col.name !== pkCol.name) {
        const index = this.indices.get(col.name)!;
        if (index.has(finalRow[col.name])) {
          throw new Error(`Unique constraint violated on column '${col.name}'`);
        }
      }
    }

    // Insert
    this.data.set(pkValue, finalRow);
    
    // Update Indices
    for (const col of this.schema.columns) {
      if (col.isUnique && col.name !== pkCol.name) {
        this.indices.get(col.name)!.set(finalRow[col.name], pkValue);
      }
    }
  }

  // --- READ ---
  selectAll(where?: WhereClause): Row[] {
    const allRows = Array.from(this.data.values());
    
    if (!where) return allRows;

    // Filter Logic
    return allRows.filter(row => String(row[where.col]) === String(where.val));
  }

  // --- UPDATE ---
  // --- UPDATE ---
  update(where: WhereClause, partialRow: Partial<Row>): number {
    let count = 0;
    const pkColName = this.getPrimaryKeyColumn().name;

    // 1. Find target rows
    const rowsToUpdate = this.selectAll(where);

    // 2. Update each
    rowsToUpdate.forEach(oldRow => {
      const pk = oldRow[pkColName];
      
      // FIX: Cast the merged result as Row to satisfy TypeScript
      const newRow = { ...oldRow, ...partialRow } as Row; 

      // Prevent PK mutation
      if (newRow[pkColName] !== oldRow[pkColName]) {
        throw new Error("Updating Primary Key is not supported in this version.");
      }

      // Update in storage
      this.data.set(pk, newRow);
      
      count++;
    });

    return count;
  }

  // --- DELETE ---
  delete(where: WhereClause): number {
    let count = 0;
    const pksToDelete: RowValue[] = [];

    this.data.forEach((row, pk) => {
      if (String(row[where.col]) === String(where.val)) {
        pksToDelete.push(pk);
      }
    });

    pksToDelete.forEach(pk => {
      const row = this.data.get(pk)!;
      // Clean indices
      for (const col of this.schema.columns) {
        if (col.isUnique && col.name !== this.getPrimaryKeyColumn().name) {
          this.indices.get(col.name)!.delete(row[col.name]);
        }
      }
      this.data.delete(pk);
      count++;
    });

    return count;
  }
}
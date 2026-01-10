export type ColumnType = 'STRING' | 'NUMBER' | 'BOOLEAN';

export interface ColumnSchema {
  name: string;
  type: ColumnType;
  isPrimaryKey?: boolean;
  isUnique?: boolean;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
}

export type RowValue = string | number | boolean;
export type Row = Record<string, RowValue>;

export interface WhereClause {
  col: string;
  val: RowValue;
}

export interface JoinClause {
  targetTable: string;
  onLeft: string;  // Column in the main table
  onRight: string; // Column in the target table
}

export interface QueryResult<T = Row[]> {
  success: boolean;
  message?: string;
  data?: T;
}
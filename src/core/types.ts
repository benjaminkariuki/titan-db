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
  onLeft: string;
  onRight: string;
}

// FIX: Added 'newActiveDb' to signal context switching
export interface QueryResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  newActiveDb?: string; 
}
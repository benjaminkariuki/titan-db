import { Database } from './Database';
import {type QueryResult } from './types';

const STORAGE_KEY = 'titandb_v1_data';

export class DBMS {
  private databases: Map<string, Database>;

  constructor() {
    this.databases = new Map();
    // Initialize with a default database so the app works immediately
  }

  createDatabase(name: string): QueryResult<null> {
    if (this.databases.has(name)) {
      return { success: false, message: `Database '${name}' already exists.` };
    }
    this.databases.set(name, new Database());
    return { success: true, message: `Database '${name}' created.` };
  }

  getDatabase(name: string): Database {
    const db = this.databases.get(name);
    if (!db) throw new Error(`Database '${name}' does not exist.`);
    return db;
  }

  // Save entire state to LocalStorage
  save() {
    const dump = Array.from(this.databases.entries()).map(([name, db]) => ({
      name,
      data: db.serialize()
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dump));
    console.log('DBMS Saved to Storage');
  }

  // Load state from LocalStorage (returns true if data was found)
  load(): boolean {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    try {
      const dump = JSON.parse(raw);
      this.databases.clear();
      
      dump.forEach((dbData: any) => {
        const db = Database.deserialize(dbData.data);
        this.databases.set(dbData.name, db);
      });
      return true;
    } catch (e) {
      console.error("Failed to load DB:", e);
      return false;
    }
  }


}
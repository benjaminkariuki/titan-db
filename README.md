TitanDB: In-Browser TypeScript RDBMS
TitanDB is a fully functional, persistent, in-memory Relational Database Management System (RDBMS) built entirely with TypeScript and React.

It simulates core database concepts—including B-Tree indexing (via Hash Maps), query parsing, ACID-like transactions, and multi-database management—running purely on the client side. The project demonstrates advanced software architecture patterns, separating the Storage Engine, Query Processor, and User Interface into distinct layers.

Live Demo
Click here to view the deployed application

https://titan-db-chi.vercel.app/

Key Features
Hybrid SQL Engine: Supports standard SQL (SELECT, CREATE) and modern JSON-injection syntax for easier data entry.

High Performance: Uses Map data structures to simulate Clustered Indices, achieving O(1) lookup speeds for Primary Keys.

Multi-Tenancy: Support for creating and switching between multiple databases (CREATE DATABASE, USE db_name).

Persistence: Automatically serializes and saves the entire DBMS state to the browser's localStorage on every write operation.

Visual Interface: A split-screen UI featuring a developer REPL (Terminal) and a "Real World" Client App (Task Manager) that reacts to database changes in real-time.

Codebase Deep Dive
Here is a detailed breakdown of what every single file in the project does.

1. The Core Engine (src/core/)
   This folder contains the "Brain" of the database. It is pure TypeScript and has no UI dependencies.

types.ts

Role: The "Contract" or Type System.

Details: Defines the shape of a Row, ColumnSchema, TableSchema, and QueryResult. It ensures type safety across the entire application, preventing us from passing invalid data structures between the database and the UI.

Table.ts

Role: The Storage Unit.

Details: Represents a single table (e.g., tasks).

Manages the Clustered Index (Primary Key storage) using a Map<PK, Row>.

Manages Secondary Indices (Unique constraints) using separate Maps.

Handles low-level CRUD operations (insert, delete, update) and strictly enforces schema validation (types and uniqueness).

Includes serialize()/deserialize() methods to convert complex Map structures to JSON for storage.

Database.ts

Role: The Table Container.

Details: Represents a single database connection (e.g., default or project_x).

Holds a collection of Table objects.

Orchestrates operations that involve table lookups.

Implements the JOIN algorithm (Nested Loop Join) to combine data from multiple tables.

DBMS.ts

Role: The System Manager.

Details: The highest-level class that manages multiple databases.

Handles CREATE DATABASE logic.

Manages the Persistence Layer, saving the entire state to localStorage and reloading it when the app starts.

Executor.ts

Role: The Interpreter / Parser.

Details: The bridge between human text (SQL) and code.

Uses Regex to parse string commands (SELECT \* FROM...).

Determines intent (Create, Read, Update, Delete).

Calls the appropriate method in the DBMS or Database classes.

Returns standardized QueryResult objects to the UI.

2. The Interface (src/components/)
   This folder contains the React components that visualize the database.

Repl.tsx

Role: The SQL Terminal.

Details: A "Hacker-style" console component. It accepts user input, maintains a history log of commands/results, and auto-scrolls. It handles CSS logic to keep the input bar pinned to the bottom.

DemoApp.tsx

Role: The Client Simulation.

Details: A "To-Do List" application that acts as a consumer of the database.

It is "dumb"—it stores no state.

To render the list, it runs SELECT \* FROM tasks.

To add a task, it generates an INSERT SQL command.

It demonstrates how a frontend application interacts with a backend database.

3. The Main Application
   App.tsx

Role: The Controller / Wiring.

Details:

Initializes the DBMS instance on load.

Handles the Global State (which database is active, history logs).

Intercepts UI-specific commands like clear or cls.

Triggers the "Save to Storage" logic whenever a query successfully modifies data.

main.tsx

Role: The Entry Point.

Details: The standard React boilerplate that mounts the application to the DOM.

How to Run Locally
Clone the repository

Bash

git clone https://github.com/benjaminkariuki/titan-db.git
cd titan-db
Install Dependencies

Bash

npm install
Start Development Server

Bash

npm run dev
Open your browser to http://localhost:5173.

Build for Production

Bash

npm run build

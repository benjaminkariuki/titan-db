import { useState, useEffect } from "react"; // Added useEffect
import { DBMS } from "./core/DBMS";
import { executeSQL } from "./core/Executor";
import { Repl } from "./components/Repl";
import { DemoApp } from "./components/DemoApp";
import { Database as DbIcon, Server } from "lucide-react";

function App() {
  // 1. Initialize DBMS with Persistence Logic
  const [dbms] = useState(() => {
    const sys = new DBMS();

    // Try to load existing data
    const loaded = sys.load();

    if (!loaded) {
      // First time user? Seed default data
      console.log("No saved data found. Seeding default DB...");
      sys.createDatabase("default"); // Helper method usage
      const defaultDb = sys.getDatabase("default"); // Get instance directly to seed

      // We manually seed here because executeSQL isn't fully wired in constructor
      // But using executeSQL is cleaner if we pass the context:
      executeSQL(
        sys,
        "default",
        "CREATE TABLE tasks (id NUMBER PK, title STRING, isDone BOOLEAN)"
      );
      executeSQL(
        sys,
        "default",
        'INSERT INTO tasks { "id": 1, "title": "Star TitanDB Repo", "isDone": false }'
      );
      sys.save(); // Save the seed immediately
    }

    return sys;
  });

  const [activeDbName, setActiveDbName] = useState("default");
  const [history, setHistory] = useState<{ cmd: string; res: any }[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleExecute = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase();

    if (cleanCmd === "clear" || cleanCmd === "cls") {
      setHistory([]);
      return;
    }

    const result = executeSQL(dbms, activeDbName, cmd);

    // --- PERSISTENCE: Save on every successful change ---
    if (result.success) {
      // Only save if it wasn't just a SELECT (optimization)
      if (!cleanCmd.startsWith("select")) {
        dbms.save();
      }
      setRefreshTrigger((prev) => prev + 1);
    }

    if (result.success && result.newActiveDb) {
      setActiveDbName(result.newActiveDb);
    }

    setHistory((prev) => [
      ...prev,
      {
        cmd,
        res: result.success
          ? result.data || result.message
          : `Error: ${result.message}`,
      },
    ]);
  };

  // Helper to get the actual DB instance for the Demo App
  // Safety check: if active DB was deleted or doesn't exist, fallback
  let currentDbInstance;
  try {
    currentDbInstance = dbms.getDatabase(activeDbName);
  } catch (e) {
    // If the active DB disappeared (rare), reset to default or first available
    currentDbInstance = dbms.getDatabase("default");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100 p-6 font-sans flex flex-col gap-6">
      <header className="flex items-center gap-3 mb-2 px-2 shrink-0">
        <div className="p-2 bg-blue-900/30 rounded-lg">
          <DbIcon className="text-blue-400" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wide text-white">
            TitanDB <span className="text-blue-500">Explorer</span>
          </h1>
          <p className="text-xs text-gray-500">
            Persistent In-Memory RDBMS • v1.2.0
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[80vh]">
        <div className="h-full">
          <Repl history={history} onExecute={handleExecute} />
        </div>

        <div className="flex flex-col gap-6 h-full">
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-900/30 rounded text-green-400">
                <Server size={18} />
              </div>
              <div>
                <div className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                  Connected To
                </div>
                <div className="text-sm font-mono text-white">
                  {activeDbName}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Data saves to LocalStorage automatically
            </div>
          </div>

          <div className="flex-1 min-h-0">
            <DemoApp
              dbms={dbms}
              activeDbName={activeDbName}
              refreshTrigger={refreshTrigger}
              onAction={(cmd) => handleExecute(cmd)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

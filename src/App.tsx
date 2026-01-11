import { useState } from "react";
import { Database } from "./core/Database";
import { executeSQL } from "./core/Executor";
import { Repl } from "./components/Repl";
import { DemoApp } from "./components/DemoApp";
import { Database as DbIcon } from "lucide-react";

function App() {
  // 1. Initialize DB Instance
  const [db] = useState(() => {
    const newDb = new Database();
    executeSQL(
      newDb,
      "CREATE TABLE tasks (id NUMBER PK, title STRING, isDone BOOLEAN)"
    );
    executeSQL(
      newDb,
      'INSERT INTO tasks { "id": 1, "title": "Star TitanDB Repo", "isDone": false }'
    );
    executeSQL(
      newDb,
      'INSERT INTO tasks { "id": 2, "title": "Complete Phase 4", "isDone": true }'
    );
    return newDb;
  });

  const [history, setHistory] = useState<{ cmd: string; res: any }[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 3. The Handler
  const handleExecute = (cmd: string) => {
    const cleanCmd = cmd.trim().toLowerCase();

    // --- FIX: Intercept "clear" or "cls" commands ---
    if (cleanCmd === "clear" || cleanCmd === "cls") {
      setHistory([]); // Wipe the screen
      return;
    }

    // Otherwise, execute as SQL
    const result = executeSQL(db, cmd);

    setHistory((prev) => [
      ...prev,
      {
        cmd,
        res: result.success
          ? result.data || result.message
          : `Error: ${result.message}`,
      },
    ]);

    if (result.success) {
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-gray-100 p-6 font-sans flex flex-col gap-6">
      {/* Header */}
      <header className="flex items-center gap-3 mb-2 px-2 shrink-0">
        <div className="p-2 bg-blue-900/30 rounded-lg">
          <DbIcon className="text-blue-400" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wide text-white">
            TitanDB <span className="text-blue-500">Explorer</span>
          </h1>
          <p className="text-xs text-gray-500">
            In-Memory TypeScript RDBMS • v1.0.0
          </p>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[80vh]">
        {/* Left: REPL */}
        <div className="h-full">
          <Repl history={history} onExecute={handleExecute} />
        </div>

        {/* Right: Demo App & Info */}
        <div className="flex flex-col gap-6 h-full">
          <div className="flex-1 min-h-0">
            {" "}
            {/* Added min-h-0 for scroll safety */}
            <DemoApp
              db={db}
              refreshTrigger={refreshTrigger}
              onAction={(cmd) => handleExecute(cmd)}
            />
          </div>

          {/* Stats Panel */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 shrink-0">
            <div className="text-xs font-mono text-gray-500 uppercase mb-2">
              System Status
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 p-3 rounded border border-neutral-800">
                <div className="text-xs text-gray-400">Database Engine</div>
                <div className="text-sm text-green-400 mt-1">
                  Online (In-Memory)
                </div>
              </div>
              <div className="bg-black/40 p-3 rounded border border-neutral-800">
                <div className="text-xs text-gray-400">Last Query Time</div>
                <div className="text-sm text-blue-400 mt-1">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

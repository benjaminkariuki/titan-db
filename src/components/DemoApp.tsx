import React, { useEffect, useState } from 'react';
import { DBMS } from '../core/DBMS'; // FIX: Import DBMS
import { executeSQL } from '../core/Executor';
import { Layers, Trash2, CheckCircle, Circle, Pencil, Save, X } from 'lucide-react';

interface DemoAppProps {
  dbms: DBMS;             // FIX: Accept the Manager
  activeDbName: string;   // FIX: Accept the Active Name
  refreshTrigger: number;
  onAction: (log: string) => void;
}

export const DemoApp: React.FC<DemoAppProps> = ({ dbms, activeDbName, refreshTrigger, onAction }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState('');
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // 1. Fetch Data
  const fetchTasks = () => {
    // FIX: Use the new 3-argument signature
    const res = executeSQL(dbms, activeDbName, "SELECT * FROM tasks");
    
    if (res.success && Array.isArray(res.data)) {
      setTasks(res.data.sort((a, b) => Number(a.id) - Number(b.id)));
    } else {
      // If table doesn't exist (e.g. new DB), clear the list
      setTasks([]);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger, activeDbName]); // FIX: Re-fetch if DB changes

  // 2. Add Task
  const handleAdd = () => {
    if (!newTask.trim()) return;
    const id = Date.now(); 
    const query = `INSERT INTO tasks { "id": ${id}, "title": "${newTask}", "isDone": false }`;
    onAction(query); 
    setNewTask('');
  };

  // 3. Toggle Status
  const toggleTask = (id: number, currentStatus: boolean) => {
    const query = `UPDATE tasks SET { "isDone": ${!currentStatus} } WHERE id=${id}`;
    onAction(query);
  };

  // 4. Delete Task
  const deleteTask = (id: number) => {
    const query = `DELETE FROM tasks WHERE id=${id}`;
    onAction(query);
  };

  // 5. Start Editing
  const startEditing = (task: any) => {
    setEditingId(task.id);
    setEditTitle(task.title);
  };

  // 6. Save Update
  const saveUpdate = () => {
    if (!editTitle.trim() || editingId === null) return;
    const query = `UPDATE tasks SET { "title": "${editTitle}" } WHERE id=${editingId}`;
    onAction(query);
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <div className="bg-neutral-800/50 p-6 rounded-lg border border-neutral-700 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
        <Layers size={14} /> Client Application (Task Manager)
      </h3>
      <p className="text-xs text-gray-500 mb-6">
        This UI runs queries against: <span className="text-blue-400 font-mono">{activeDbName}</span>
      </p>

      {/* Add Input */}
      <div className="flex gap-2 mb-6">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none transition-colors"
          placeholder="Add a new task..."
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
        >
          Add
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2 overflow-y-auto min-h-0 flex-1 pr-2">
        {tasks.length === 0 && (
          <div className="text-center text-gray-600 py-8 italic text-sm">
            {/* Helpful message based on context */}
            No tasks found in <span className='font-mono text-gray-500'>{activeDbName}</span>.
            <br/>
            (Did you create the 'tasks' table yet?)
          </div>
        )}
        
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded hover:border-neutral-600 transition-colors group">
            {editingId === task.id ? (
              <div className="flex items-center gap-2 w-full">
                <input 
                  className="flex-1 bg-black border border-blue-500 rounded px-2 py-1 text-sm text-white outline-none"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveUpdate();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                />
                <button onClick={saveUpdate} className="text-green-500 hover:text-green-400 p-1"><Save size={16} /></button>
                <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-400 p-1"><X size={16} /></button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="cursor-pointer shrink-0" onClick={() => toggleTask(task.id, task.isDone)}>
                    {task.isDone ? <CheckCircle size={18} className="text-green-500" /> : <Circle size={18} className="text-gray-500 group-hover:text-blue-400" />}
                  </div>
                  <div className="flex flex-col truncate">
                    <span className={`text-sm truncate ${task.isDone ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task.title}</span>
                    <span className="text-[10px] font-mono text-gray-600">ID: {task.id}</span>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditing(task)} className="text-gray-500 hover:text-blue-400 p-1.5"><Pencil size={14} /></button>
                  <button onClick={() => deleteTask(task.id)} className="text-gray-500 hover:text-red-500 p-1.5"><Trash2 size={14} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
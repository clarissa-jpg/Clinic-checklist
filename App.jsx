import { useState, useEffect } from "react";

const DEFAULT_TASKS = {
  daily: [
    { id: "d1", label: "Check in on team" },
    { id: "d2", label: "Check Slack" },
    { id: "d3", label: "Review leave / sick leave inputs" },
  ],
  weekly: [
    { id: "w1", label: "Publish Monday Pulse (wins, shout-outs, weekly focus)" },
    { id: "w2", label: "Review meeting minutes" },
    { id: "w3", label: "30-min meeting with assistant directors" },
    { id: "w4", label: "Review Allie (KPI platform)" },
    { id: "w5", label: "Review Practitioner Portal (patients without upcoming appt)" },
    { id: "w6", label: "Review Clinic Dashboard" },
  ],
  fortnightly: [
    { id: "f1", label: "Choose fortnightly gift recipient" },
    { id: "f2", label: "Order gift (or brief admin staff)" },
    { id: "f3", label: "Regional meeting" },
    { id: "f4", label: "Performance meeting" },
    { id: "f5", label: "Clinic 1:1" },
  ],
  monthly: [
    { id: "m1", label: "Team lunch" },
  ],
  biannual: [
    { id: "b1", label: "Referrer nurturing campaign (June)" },
    { id: "b2", label: "Referrer nurturing campaign (November)" },
  ],
  quarterly: [
    { id: "q1", label: "Review mentoring channels for each team member" },
    { id: "q2", label: "Quarterly development meetings with each team member" },
    { id: "q3", label: "Update clinic goals in yearly plan" },
  ],
};

const TABS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "fortnightly", label: "Fortnightly" },
  { key: "monthly", label: "Monthly" },
  { key: "biannual", label: "Bi-annual" },
  { key: "quarterly", label: "Quarterly" },
];

const STORAGE_KEY = "clarissa-checklist-v2";

function genId() {
  return "t" + Math.random().toString(36).slice(2, 8);
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { tasks: DEFAULT_TASKS, checked: {} };
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export default function App() {
  const [activeTab, setActiveTab] = useState("daily");
  const [editMode, setEditMode] = useState(false);
  const [data, setData] = useState(loadData);
  const [newTaskText, setNewTaskText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => { saveData(data); }, [data]);

  const tasks = data.tasks[activeTab] || [];
  const checked = data.checked;
  const doneCount = tasks.filter(t => checked[t.id]).length;
  const total = tasks.length;
  const progress = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  function toggle(id) {
    if (editMode) return;
    setData(prev => ({
      ...prev,
      checked: { ...prev.checked, [id]: !prev.checked[id] },
    }));
  }

  function resetTab() {
    const ids = tasks.map(t => t.id);
    setData(prev => {
      const next = { ...prev.checked };
      ids.forEach(id => delete next[id]);
      return { ...prev, checked: next };
    });
  }

  function addTask() {
    const label = newTaskText.trim();
    if (!label) return;
    const newTask = { id: genId(), label };
    setData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [activeTab]: [...(prev.tasks[activeTab] || []), newTask],
      },
    }));
    setNewTaskText("");
  }

  function deleteTask(id) {
    setData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [activeTab]: prev.tasks[activeTab].filter(t => t.id !== id),
      },
      checked: (() => {
        const next = { ...prev.checked };
        delete next[id];
        return next;
      })(),
    }));
  }

  function startEdit(task) {
    setEditingId(task.id);
    setEditingText(task.label);
  }

  function saveEdit(id) {
    const label = editingText.trim();
    if (!label) return;
    setData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [activeTab]: prev.tasks[activeTab].map(t =>
          t.id === id ? { ...t, label } : t
        ),
      },
    }));
    setEditingId(null);
    setEditingText("");
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <p style={s.eyebrow}>Move Beyond · Chatswood</p>
          <h1 style={s.title}>Clinic Director</h1>
          <p style={s.subtitle}>Task Checklist</p>
        </div>
        <button
          onClick={() => { setEditMode(e => !e); setEditingId(null); }}
          style={{ ...s.editToggle, ...(editMode ? s.editToggleActive : {}) }}
        >
          {editMode ? "Done editing" : "Edit tasks"}
        </button>
      </header>

      {/* Tabs */}
      <nav style={s.tabBar}>
        {TABS.map(tab => {
          const tabTasks = data.tasks[tab.key] || [];
          const done = tabTasks.filter(t => checked[t.id]).length;
          const allDone = done > 0 && done === tabTasks.length;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setEditingId(null); setNewTaskText(""); }}
              style={{ ...s.tab, ...(activeTab === tab.key ? s.tabActive : {}) }}
            >
              {tab.label}
              {done > 0 && (
                <span style={{
                  ...s.tabBadge,
                  background: allDone ? "#2d6a4f" : "#e8c468",
                  color: allDone ? "#fff" : "#1a1a1a",
                }}>
                  {allDone ? "✓" : done}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Progress */}
      {!editMode && (
        <div style={s.progressSection}>
          <div style={s.progressMeta}>
            <span style={s.progressLabel}>{doneCount} of {total} done</span>
            <button onClick={resetTab} style={s.resetBtn}>Reset</button>
          </div>
          <div style={s.progressTrack}>
            <div style={{
              ...s.progressFill,
              width: `${progress}%`,
              background: progress === 100 ? "#2d6a4f" : "#c8956c",
            }} />
          </div>
        </div>
      )}

      {/* Edit mode banner */}
      {editMode && (
        <div style={s.editBanner}>
          Tap a task to rename it · Swipe or tap ✕ to delete · Add new tasks below
        </div>
      )}

      {/* Main */}
      <main style={s.main}>
        {!editMode && progress === 100 && (
          <div style={s.allDoneBanner}>
            All {TABS.find(t => t.key === activeTab)?.label.toLowerCase()} tasks complete ✓
          </div>
        )}

        <ul style={s.list}>
          {tasks.map(task => {
            const done = !!checked[task.id];
            const isEditing = editingId === task.id;

            if (editMode) {
              return (
                <li key={task.id} style={s.editItem}>
                  {isEditing ? (
                    <div style={s.editRow}>
                      <input
                        style={s.editInput}
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEdit(task.id); if (e.key === "Escape") setEditingId(null); }}
                        autoFocus
                      />
                      <button onClick={() => saveEdit(task.id)} style={s.saveBtn}>Save</button>
                    </div>
                  ) : (
                    <div style={s.editRow}>
                      <span style={s.editLabel} onClick={() => startEdit(task)}>{task.label}</span>
                      <button onClick={() => deleteTask(task.id)} style={s.deleteBtn}>✕</button>
                    </div>
                  )}
                </li>
              );
            }

            return (
              <li key={task.id} onClick={() => toggle(task.id)} style={{ ...s.item, ...(done ? s.itemDone : {}) }}>
                <span style={{ ...s.checkbox, ...(done ? s.checkboxDone : {}) }}>
                  {done && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </span>
                <span style={done ? s.labelDone : s.label}>{task.label}</span>
              </li>
            );
          })}
        </ul>

        {/* Add task input */}
        {editMode && (
          <div style={s.addRow}>
            <input
              style={s.addInput}
              placeholder="Add a new task..."
              value={newTaskText}
              onChange={e => setNewTaskText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addTask(); }}
            />
            <button onClick={addTask} style={s.addBtn}>Add</button>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#f7f4ef", fontFamily: "'Georgia', serif", maxWidth: 540, margin: "0 auto" },
  header: { background: "#1c3a2f", padding: "28px 24px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  eyebrow: { margin: 0, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8ab89a" },
  title: { margin: "6px 0 0", fontSize: 26, fontWeight: "normal", color: "#f0ebe3", letterSpacing: "-0.01em", lineHeight: 1.1 },
  subtitle: { margin: "4px 0 0", fontSize: 13, color: "#8ab89a" },
  editToggle: { background: "none", border: "1px solid #4a7a60", borderRadius: 6, padding: "7px 14px", color: "#8ab89a", fontSize: 12, cursor: "pointer", fontFamily: "sans-serif", letterSpacing: "0.04em", flexShrink: 0 },
  editToggleActive: { background: "#c8956c", borderColor: "#c8956c", color: "#fff" },
  tabBar: { display: "flex", overflowX: "auto", background: "#1c3a2f", borderTop: "1px solid #2d5240", padding: "0 12px", gap: 4, scrollbarWidth: "none" },
  tab: { flex: "0 0 auto", padding: "10px 14px", background: "none", border: "none", borderBottom: "2px solid transparent", color: "#8ab89a", fontSize: 13, cursor: "pointer", fontFamily: "'Georgia', serif", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" },
  tabActive: { color: "#f0ebe3", borderBottom: "2px solid #c8956c" },
  tabBadge: { display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 18, height: 18, borderRadius: 9, fontSize: 10, fontFamily: "sans-serif", fontWeight: 600, padding: "0 4px" },
  progressSection: { padding: "16px 24px 10px", background: "#f0ebe3", borderBottom: "1px solid #e0d8cc" },
  progressMeta: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel: { fontSize: 12, color: "#6b5e4e", fontFamily: "sans-serif", letterSpacing: "0.04em" },
  resetBtn: { background: "none", border: "1px solid #c8b89a", borderRadius: 4, padding: "3px 10px", fontSize: 11, color: "#6b5e4e", cursor: "pointer", fontFamily: "sans-serif" },
  progressTrack: { height: 4, background: "#e0d8cc", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2, transition: "width 0.3s ease, background 0.3s ease" },
  editBanner: { background: "#f0ebe3", borderBottom: "1px solid #e0d8cc", padding: "10px 24px", fontSize: 12, color: "#6b5e4e", fontFamily: "sans-serif", letterSpacing: "0.02em" },
  main: { padding: "8px 24px 40px" },
  allDoneBanner: { background: "#2d6a4f", color: "#fff", borderRadius: 6, padding: "10px 16px", fontSize: 13, fontFamily: "sans-serif", margin: "12px 0 4px", textAlign: "center" },
  list: { listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column", gap: 2 },
  item: { display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#fff", borderRadius: 8, cursor: "pointer", border: "1px solid #e8e0d4", userSelect: "none" },
  itemDone: { background: "#f0f7f3", borderColor: "#c8ddd0" },
  checkbox: { width: 22, height: 22, borderRadius: 6, border: "2px solid #c8b89a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  checkboxDone: { background: "#2d6a4f", borderColor: "#2d6a4f" },
  label: { fontSize: 15, color: "#2a2320", lineHeight: 1.4 },
  labelDone: { fontSize: 15, color: "#8a9e90", lineHeight: 1.4, textDecoration: "line-through", textDecorationColor: "#b0c4b8" },
  editItem: { background: "#fff", borderRadius: 8, border: "1px solid #e8e0d4", padding: "10px 14px", marginBottom: 2 },
  editRow: { display: "flex", alignItems: "center", gap: 10 },
  editLabel: { flex: 1, fontSize: 15, color: "#2a2320", cursor: "pointer", padding: "4px 0" },
  editInput: { flex: 1, fontSize: 15, padding: "6px 10px", border: "1px solid #c8956c", borderRadius: 6, fontFamily: "'Georgia', serif", outline: "none", color: "#2a2320" },
  saveBtn: { background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer", fontFamily: "sans-serif" },
  deleteBtn: { background: "none", border: "none", color: "#b08080", fontSize: 16, cursor: "pointer", padding: "4px 6px", lineHeight: 1 },
  addRow: { display: "flex", gap: 10, marginTop: 16 },
  addInput: { flex: 1, fontSize: 15, padding: "10px 14px", border: "1px solid #c8b89a", borderRadius: 8, fontFamily: "'Georgia', serif", outline: "none", background: "#fff", color: "#2a2320" },
  addBtn: { background: "#1c3a2f", color: "#f0ebe3", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, cursor: "pointer", fontFamily: "sans-serif", letterSpacing: "0.03em" },
};

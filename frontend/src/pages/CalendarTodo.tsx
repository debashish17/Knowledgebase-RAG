import { useState } from "react";
import { useTodoContext } from "../context/TodoContext";
import { useNavigate } from "react-router-dom";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion, AnimatePresence } from "framer-motion";

interface TodoItem {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  category: string;
}


const CalendarTodo = () => {
  const navigate = useNavigate();
  const { todos, addTodo, toggleComplete, deleteTodo } = useTodoContext();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [calendarDate, setCalendarDate] = useState<Date | null>(null);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState("Study");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");

  const handleAddTodo = () => {
    const taskDate = date || (calendarDate ? calendarDate.toISOString().slice(0, 10) : "");
    if (!title || !taskDate) return;
    addTodo({
      title,
      date: taskDate,
      completed: false,
      priority,
      category
    });
    setTitle("");
    setDate("");
    setCalendarDate(null);
    setPriority("medium");
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "from-red-500/20 to-orange-500/20 border-red-400/40",
      medium: "from-yellow-500/20 to-amber-500/20 border-yellow-400/40",
      low: "from-green-500/20 to-emerald-500/20 border-green-400/40"
    };
    return colors[priority as keyof typeof colors] || "from-gray-500/20 to-gray-600/20 border-gray-400/40";
  };

  const getPriorityGlow = (priority: string) => {
    const glows = {
      high: "shadow-red-500/30",
      medium: "shadow-yellow-500/30",
      low: "shadow-green-500/30"
    };
    return glows[priority as keyof typeof glows] || "shadow-gray-500/30";
  };

  const filteredTodos = todos
    .filter(todo => {
      if (filter === "active") return !todo.completed;
      if (filter === "completed") return todo.completed;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length,
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}} />
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate("/chat")}
        className="fixed top-6 left-6 z-50 p-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/60 transition-all duration-300"
        aria-label="Back to Chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </motion.button>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-glass/50 backdrop-blur-glass border border-white/10 rounded-3xl p-6 mb-8 shadow-2xl"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Study Calendar & Todo
              </h1>
              <p className="text-muted-foreground mt-1">Organize your study life with style ✨</p>
            </div>
            
            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{stats.active}</div>
                <div className="text-xs text-muted-foreground">Active</div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Calendar & Add Form */}
          <div className="lg:col-span-1 space-y-6">
            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-glass/60 backdrop-blur-glass border border-white/10 rounded-2xl p-4 shadow-xl"
            >
              <h2 className="text-lg font-semibold mb-3 text-foreground">Select Date</h2>
              <Calendar
                onChange={date => setCalendarDate(date as Date)}
                value={calendarDate}
                className="w-full rounded-xl bg-background/50 border-0 shadow-inner"
                tileClassName={({ date }) => {
                  const iso = date.toISOString().slice(0, 10);
                  return todos.some(todo => todo.date === iso)
                    ? 'bg-blue-500/30 border-2 border-blue-400/60 rounded-lg font-bold' 
                    : 'hover:bg-blue-500/10';
                }}
              />
              <p className="text-xs text-muted-foreground mt-3 text-center">
                {calendarDate ? `Selected: ${calendarDate.toLocaleDateString()}` : 'Click a date to select'}
              </p>
            </motion.div>

            {/* Add Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-glass/60 backdrop-blur-glass border border-white/10 rounded-2xl p-5 shadow-xl"
            >
              <h2 className="text-lg font-semibold mb-4 text-foreground">Add New Task</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleAddTodo()}
                  className="w-full px-4 py-3 bg-background/70 border border-blue-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/60 focus:shadow-lg focus:shadow-blue-500/20 transition-all"
                />
                
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-background/70 border border-blue-400/30 rounded-xl text-white focus:outline-none focus:border-blue-400/60 focus:shadow-lg focus:shadow-blue-500/20 transition-all"
                  title="Select date"
                  placeholder="Select date"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="px-3 py-2 bg-background/70 border border-purple-400/30 rounded-xl text-white text-sm focus:outline-none focus:border-purple-400/60 transition-all"
                    title="Select category"
                  >
                    <option value="Study">📚 Study</option>
                    <option value="Assignment">📝 Assignment</option>
                    <option value="Exam">🎯 Exam</option>
                    <option value="Project">💼 Project</option>
                    <option value="Other">⭐ Other</option>
                  </select>
                  
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as "low" | "medium" | "high")}
                    className="px-3 py-2 bg-background/70 border border-purple-400/30 rounded-xl text-white text-sm focus:outline-none focus:border-purple-400/60 transition-all"
                    title="Select priority"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddTodo}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold text-white shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/60 transition-all duration-300"
                >
                  ✨ Add Task
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Right: Todo List */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-glass/60 backdrop-blur-glass border border-white/10 rounded-2xl p-6 shadow-xl"
            >
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="flex gap-2">
                  {(['all', 'active', 'completed'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                        filter === f
                          ? f === 'all' ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50 shadow-lg shadow-blue-500/30'
                          : f === 'active' ? 'bg-orange-500/30 text-orange-300 border border-orange-400/50 shadow-lg shadow-orange-500/30'
                          : 'bg-green-500/30 text-green-300 border border-green-400/50 shadow-lg shadow-green-500/30'
                          : 'bg-slate-800/30 text-gray-400 border border-gray-600/30 hover:border-blue-400/30'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 ml-auto">
                  {(['date', 'priority'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                        sortBy === s
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-lg shadow-purple-500/30'
                          : 'bg-slate-800/30 text-gray-400 border border-gray-600/30 hover:border-purple-400/30'
                      }`}
                    >
                      {s === 'date' ? '📅 Date' : '🎯 Priority'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Todo List */}
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {filteredTodos.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-20"
                    >
                      <div className="text-6xl mb-4">📝</div>
                      <p className="text-gray-400">No tasks found. {filter !== 'all' ? 'Try changing filters.' : 'Add one to get started!'}</p>
                    </motion.div>
                  ) : (
                    filteredTodos.map((todo, index) => (
                      <motion.div
                        key={todo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        className={`group bg-gradient-to-br ${getPriorityColor(todo.priority)} backdrop-blur-xl border rounded-xl p-4 shadow-lg ${getPriorityGlow(todo.priority)} transition-all cursor-pointer`}
                      >
                        <div className="flex items-center gap-3">
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => toggleComplete(todo.id)}
                            className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              todo.completed
                                ? "bg-green-500 border-green-400 shadow-lg shadow-green-500/50"
                                : "border-gray-500 hover:border-blue-400"
                            }`}
                          >
                            {todo.completed && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </motion.button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium ${todo.completed ? "line-through text-gray-500" : "text-white"}`}>
                                {todo.title}
                              </span>
                              <span className="px-2 py-0.5 bg-purple-500/30 border border-purple-400/50 rounded-md text-xs text-purple-300">
                                {todo.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                              <span>📅 {new Date(todo.date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{todo.priority === "high" ? "🔴" : todo.priority === "medium" ? "🟡" : "🟢"}</span>
                            </div>
                          </div>

                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteTodo(todo.id)}
                            className="shrink-0 p-2 bg-red-500/20 border border-red-400/30 rounded-lg text-red-400 hover:bg-red-500/30 hover:shadow-lg hover:shadow-red-500/30 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
        .react-calendar {
          border: none !important;
          font-family: inherit;
        }
        .react-calendar__tile {
          border-radius: 8px;
          transition: all 0.2s;
        }
        .react-calendar__tile:hover {
          background: rgba(59, 130, 246, 0.2) !important;
        }
        .react-calendar__tile--active {
          background: rgba(59, 130, 246, 0.3) !important;
          border: 2px solid rgba(59, 130, 246, 0.6) !important;
        }
        .react-calendar__navigation button {
          color: white;
          font-weight: 600;
        }
        .react-calendar__navigation button:hover {
          background: rgba(59, 130, 246, 0.2);
        }
        .react-calendar__month-view__weekdays {
          color: rgba(156, 163, 175);
          font-weight: 600;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default CalendarTodo;
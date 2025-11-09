import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface TodoItem {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  category: string;
}

interface TodoContextType {
  todos: TodoItem[];
  addTodo: (todo: Omit<TodoItem, "id">) => void;
  toggleComplete: (id: string) => void;
  deleteTodo: (id: string) => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const useTodoContext = () => {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("useTodoContext must be used within a TodoProvider");
  return ctx;
};

export const TodoProvider = ({ children }: { children: ReactNode }) => {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    const saved = localStorage.getItem("todos");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = (todo: Omit<TodoItem, "id">) => {
    setTodos(prev => [
      ...prev,
      { ...todo, id: Date.now().toString() }
    ]);
  };

  const toggleComplete = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  return (
    <TodoContext.Provider value={{ todos, addTodo, toggleComplete, deleteTodo }}>
      {children}
    </TodoContext.Provider>
  );
};

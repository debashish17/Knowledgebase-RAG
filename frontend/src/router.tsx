import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import CalendarTodo from "./pages/CalendarTodo";

const Router = () => (
  <BrowserRouter>
    <Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/chat" element={<Index />} />
  <Route path="/calendar" element={<CalendarTodo />} />
    </Routes>
  </BrowserRouter>
);

export default Router;

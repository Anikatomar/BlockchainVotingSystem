import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Vote from "./pages/Vote";
import LiveDashboard from "./pages/LiveDashboard";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/dashboard" element={<LiveDashboard />} />
        <Route path="/results" element={<Results />} />
        <Route path="*" element={<NotFound />} />
        <Route
    path="/admin/dashboard"
    element={<AdminDashboard/>}
/>
      </Routes>
      
    </BrowserRouter>
  );
}

export default App;
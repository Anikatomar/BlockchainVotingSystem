
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Vote from "./pages/Vote";
import LiveDashboard from "./pages/LiveDashboard";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";

// New multi-election pages
import Elections from "./pages/Elections";
import ElectionDetails from "./pages/ElectionDetails";
import ElectionResults from "./pages/ElectionResults";
import AuditHistory from "./pages/AuditHistory";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Existing routes */}
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/dashboard" element={<LiveDashboard />} />
        <Route path="/results" element={<Results />} />

        {/* Multi-election routes */}
        <Route path="/elections" element={<Elections />} />
        <Route
          path="/election/:electionId"
          element={<ElectionDetails />}
        />
        <Route
          path="/election/:electionId/results"
          element={<ElectionResults />}
        />
        <Route
          path="/election/:electionId/audit"
          element={<AuditHistory />}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

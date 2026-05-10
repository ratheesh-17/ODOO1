import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateTrip from "./pages/CreateTrip";
import EditTrip from "./pages/EditTrip";
import TripsList from "./pages/TripsList";
import TripDetail from "./pages/TripDetail";
import Cities from "./pages/Cities";
import CityDetail from "./pages/CityDetail";
import AddStop from "./pages/AddStop";
import EditStop from "./pages/EditStop";
import AddActivity from "./pages/AddActivity";
import Budget from "./pages/Budget";
import Packing from "./pages/Packing";
import Notes from "./pages/Notes";
import Profile from "./pages/Profile";
import SharedTrip from "./pages/SharedTrip";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/trips" element={<PrivateRoute><TripsList /></PrivateRoute>} />
        <Route path="/trips/new" element={<PrivateRoute><CreateTrip /></PrivateRoute>} />
        <Route path="/trips/:tripId" element={<PrivateRoute><TripDetail /></PrivateRoute>} />
        <Route path="/trips/:tripId/edit" element={<PrivateRoute><EditTrip /></PrivateRoute>} />
        <Route path="/trips/:tripId/stops/new" element={<PrivateRoute><AddStop /></PrivateRoute>} />
        <Route path="/trips/:tripId/stops/:stopId/edit" element={<PrivateRoute><EditStop /></PrivateRoute>} />
        <Route path="/trips/:tripId/stops/:stopId/activities" element={<PrivateRoute><AddActivity /></PrivateRoute>} />
        <Route path="/trips/:tripId/budget" element={<PrivateRoute><Budget /></PrivateRoute>} />
        <Route path="/trips/:tripId/packing" element={<PrivateRoute><Packing /></PrivateRoute>} />
        <Route path="/trips/:tripId/notes" element={<PrivateRoute><Notes /></PrivateRoute>} />
        <Route path="/cities" element={<PrivateRoute><Cities /></PrivateRoute>} />
        <Route path="/cities/:cityId" element={<PrivateRoute><CityDetail /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/shared/:token" element={<SharedTrip />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;

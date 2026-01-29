import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import Home from './pages/Home.jsx'
import Advisory from './pages/Advisory.jsx'
import Market from './pages/Market.jsx'
import Cost from './pages/Cost.jsx'
import InsectDetector from './pages/InsectDetector.jsx'
import AskExpert from './pages/AskExpert.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NotFound from './pages/NotFound.jsx'
import Profile from './pages/Profile.jsx'

import AdminRoute from './routes/AdminRoute'

import AdminLayout from './pages/admin/AdminLayout'
import AdminOverview from './pages/admin/Overview.jsx'
import AdminUsers from './pages/admin/Users'
import AdminStories from './pages/admin/Stories'
import AdminSettings from './pages/admin/Settings'
import AdminAdvisoryPage from './pages/admin/AdminAdvisoryPage'
import AdminMarketPage from './pages/admin/AdminMarketPage'
import AdminInputsPage from './pages/admin/AdminInputPage.jsx'
import ExpertDashboard from './pages/expert/ExpertDashboard.jsx'
import ExpertRoute from './routes/ExpertRoute.jsx'
import InsectDetectorPage from './pages/InsectdetectorPage.jsx'

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="min-h-[90vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/advisory" element={<Advisory />} />
          <Route path="/market" element={<Market />} />
          <Route path="/cost" element={<Cost />} />
          <Route path="/insects" element={<InsectDetectorPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expert"
            element={
              <ExpertRoute>
                <ExpertDashboard />
              </ExpertRoute>
            }
          />
          <Route
            path="/ask"
            element={
              <ProtectedRoute>
                <AskExpert />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="stories" element={<AdminStories />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="advisory" element={<AdminAdvisoryPage />} />
            <Route path="market" element={<AdminMarketPage />} />
            <Route path="input" element={<AdminInputsPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

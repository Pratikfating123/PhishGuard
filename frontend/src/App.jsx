import { Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth'
import Landing from './pages/Landing'
import { ForgotPassword, ResetPassword, SignIn, SignUp } from './pages/Auth'
import DashboardLayout from './dashboard/Layout'
import Overview from './dashboard/Overview'
import Inbox from './dashboard/Inbox'
import Analyze from './dashboard/Analyze'
import Result from './dashboard/Result'
import Threats from './dashboard/Threats'
import Quarantine from './dashboard/Quarantine'
import Reports from './dashboard/Reports'
import AuditLogs from './dashboard/AuditLogs'
import Settings from './dashboard/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/app" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route index element={<Overview />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="analyze" element={<Analyze />} />
        <Route path="analysis/:id" element={<Result />} />
        <Route path="threats" element={<Threats />} />
        <Route path="quarantine" element={<Quarantine />} />
        <Route path="reports" element={<Reports />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<div className="p-10">Page not found.</div>} />
    </Routes>
  )
}

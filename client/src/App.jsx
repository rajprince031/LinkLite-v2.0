import LogInPage from './component/LogInPage'
import SingUpPage from './component/SignUpPage'
import HomePage from './component/HomePage'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './component/DashboardPage'
import IsAuthRoute from './Authentication/IsAuthRoute'
import ViewDetails from './component/ViewDetails'
import UserProfile from './component/UserProfile'
import IsLoginRoute from './Authentication/IsLoginRoute'
import UpdateProfile from './component/UpdateProfile'
import HomePageAuth from './Authentication/HomePageAuth'
import AboutPage from './component/AboutPage'
import ContactPage from './component/ContactPage'
import VerifyOtpPage from './component/VerifyOtpPage'
import ForgotPasswordPage from './component/ForgotPasswordPage'
import AdminLoginPage from './component/AdminLoginPage'
import AdminDashboardPage from './component/AdminDashboardPage'
import AdminAuthRoute from './Authentication/AdminAuthRoute'
import PageNotFound from './component/PageNotFound'
import LinkUnavailablePage from './component/LinkUnavailablePage'

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route Component={HomePageAuth}>
            <Route path='/' Component={HomePage} />
            <Route path='/about' Component={AboutPage} />
            <Route path='/contact' Component={ContactPage} />
            <Route path="/link-unavailable" Component={LinkUnavailablePage} />
          </Route>
          <Route Component={IsLoginRoute}>
            <Route path="/login" Component={LogInPage} />
            <Route path="/signup" Component={SingUpPage} />
            <Route path="/verify-otp" Component={VerifyOtpPage} />
            <Route path="/forgot-password" Component={ForgotPasswordPage} />
          </Route>
          <Route Component={IsAuthRoute}>
            <Route path='/dashboard' Component={Dashboard} />
            <Route path='/dashboard/view-details/:id' Component={ViewDetails} />
            <Route path='/dashboard/user-profile' Component={UserProfile} />
            <Route path='/dashboard/update-profile' Component={UpdateProfile} />
          </Route>
          <Route path="/admin/login" Component={AdminLoginPage} />
          <Route Component={AdminAuthRoute}>
            <Route path="/admin/dashboard" Component={AdminDashboardPage} />
          </Route>
          <Route path="*" Component={PageNotFound} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;

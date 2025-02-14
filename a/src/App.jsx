import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';

// Components
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ExamList from './components/exam/ExamList';
import ExamCreate from './components/exam/ExamCreate';
import ExamDetail from './components/exam/ExamDetail';
import ExamAttempt from './components/exam/ExamAttempt';
import AuthGuard from './components/auth/AuthGuard';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route element={<AuthGuard><DashboardLayout /></AuthGuard>}>
              <Route path="/" element={<ExamList />} />
              <Route path="/exam/create" element={<ExamCreate />} />
              <Route path="/exam/:id" element={<ExamDetail />} />
              <Route path="/exam/:id/attempt" element={<ExamAttempt />} />
            </Route>

            {/* Redirect any unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
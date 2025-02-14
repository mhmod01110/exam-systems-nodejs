import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ExamList from '@/components/exam/ExamList';
import ExamCreate from '@/components/exam/ExamCreate';
import ExamDetail from '@/components/exam/ExamDetail';
import ExamAttempt from '@/components/exam/ExamAttempt';
import SubmitMCQ from '@/components/submission/SubmitMCQ';
import SubmitProject from '@/components/submission/SubmitProject';

const App = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" /> : <Register />}
      />

      {/* Protected Routes */}
      <Route element={<AuthGuard />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/exams" replace />} />
          
          {/* Exam Routes */}
          <Route path="exams">
            <Route index element={<ExamList />} />
            <Route path="create" element={<ExamCreate />} />
            <Route path=":examId">
              <Route index element={<ExamDetail />} />
              <Route path="attempt" element={<ExamAttempt />} />
            </Route>
          </Route>

          {/* Submission Routes */}
          <Route path="submissions">
            <Route index element={<Navigate to="/submissions/my" replace />} />
            <Route path="my" element={<div>My Submissions</div>} />
            <Route path="review" element={<div>Review Submissions</div>} />
          </Route>

          {/* Question Submission Routes */}
          <Route path="questions">
            <Route path=":questionId/mcq" element={<SubmitMCQ />} />
            <Route path=":questionId/project" element={<SubmitProject />} />
          </Route>
        </Route>
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TeacherLogin from './pages/TeacherLogin';
import TeacherRegister from './pages/TeacherRegister';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import SessionLobby from './pages/SessionLobby';
import SessionHistory from './pages/SessionHistory';
import StudentJoin from './pages/StudentJoin';
import StudentPlay from './pages/StudentPlay';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<TeacherLogin />} />
        <Route path="/register" element={<TeacherRegister />} />
        
        {/* Protected Teacher Routes (Simplified protection for MVP) */}
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/history" element={<SessionHistory />} />
        <Route path="/teacher/quizzes/new" element={<CreateQuiz />} />
        <Route path="/teacher/quizzes/:quizId/edit" element={<EditQuiz />} />
        <Route path="/teacher/session/:sessionCode" element={<SessionLobby />} />
        
        {/* Public Student Routes */}
        <Route path="/join/:joinToken" element={<StudentJoin />} />
        <Route path="/play/:sessionCode/:studentId" element={<StudentPlay />} />
        
        {/* Display Routes */}
        <Route path="/leaderboard/:sessionCode" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

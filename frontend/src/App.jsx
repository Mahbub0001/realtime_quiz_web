import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TeacherLogin from './pages/TeacherLogin';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import SessionLobby from './pages/SessionLobby';
import StudentJoin from './pages/StudentJoin';
import StudentPlay from './pages/StudentPlay';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<TeacherLogin />} />
        
        {/* Protected Teacher Routes (Simplified protection for MVP) */}
        <Route path="/teacher" element={<TeacherDashboard />} />
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

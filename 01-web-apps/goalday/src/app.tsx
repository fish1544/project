import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import WeekPage from '@/pages/WeekPage/WeekPage';
import HabitsPage from '@/pages/HabitsPage/HabitsPage';
import JournalPage from '@/pages/JournalPage/JournalPage';
import TodoPage from '@/pages/TodoPage/TodoPage';
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<WeekPage />} />
        <Route path="habits" element={<HabitsPage />} />
        <Route path="journal" element={<JournalPage />} />
        <Route path="todo" element={<TodoPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

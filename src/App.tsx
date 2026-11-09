import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ErrorBoundary } from './components/layout/Fallback'
import AppShell from './components/layout/AppShell'
import ChatPage from './pages/ChatPage'
import TrendPage from './pages/Ranking'
import HistoryPage from './pages/HistoryPage'
import AboutPage from './pages/AboutPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<ChatPage />} />
            <Route path="trend" element={<TrendPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

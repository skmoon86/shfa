import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { CalendarPage } from './pages/CalendarPage'
import { WeatherPage } from './pages/WeatherPage'
import { CritterpediaPage } from './pages/CritterpediaPage'
import { ItemsPage } from './pages/ItemsPage'
import { RecipesPage } from './pages/RecipesPage'
import { VillagersPage } from './pages/VillagersPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="weather" element={<WeatherPage />} />
        <Route path="critterpedia" element={<CritterpediaPage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="villagers" element={<VillagersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route
          path="*"
          element={<div className="py-16 text-center">페이지를 찾을 수 없어요</div>}
        />
      </Route>
    </Routes>
  )
}

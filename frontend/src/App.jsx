import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Courses from './pages/Courses'
import Professors from './pages/Professors'
import ScheduleBuilder from './pages/ScheduleBuilder'

export default function App() {
  const [schedule, setSchedule] = useState([])

  function addToSchedule(course) {
    setSchedule((prev) => {
      if (prev.find((c) => c.course_id === course.course_id)) return prev
      return [...prev, course]
    })
  }

  function removeFromSchedule(courseId) {
    setSchedule((prev) => prev.filter((c) => c.course_id !== courseId))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar scheduleCount={schedule.length} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/courses"
            element={<Courses onAddToSchedule={addToSchedule} schedule={schedule} />}
          />
          <Route path="/professors" element={<Professors />} />
          <Route
            path="/schedule"
            element={
              <ScheduleBuilder
                schedule={schedule}
                onRemove={removeFromSchedule}
              />
            }
          />
        </Routes>
      </main>
    </div>
  )
}

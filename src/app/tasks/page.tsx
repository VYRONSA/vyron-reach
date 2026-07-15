'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Task } from '@/types'

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')

  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    setTasks(data || [])
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const addTask = async () => {
    await supabase.from('tasks').insert([{ title, status: 'open' }])
    setTitle('')
    fetchTasks()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>

      <div className="flex gap-2 mb-4">
        <input placeholder="Task" value={title} onChange={e => setTitle(e.target.value)} className="border p-2"/>
        <button onClick={addTask} className="bg-purple-600 text-white px-4">Add</button>
      </div>

      <ul>
        {tasks.map(t => (
          <li key={t.id} className="border-b py-2">
            {t.title}
          </li>
        ))}
      </ul>
    </div>
  )
}
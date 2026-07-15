'use client'
import { automationTasks } from '@/lib/automationEngine'

export function AutomationEnginePage(){
 const tasks = automationTasks()

 return (
  <div className="space-y-4">
   <h1 className="text-5xl font-black text-white">Automation Engine</h1>
   {tasks.map(task => (
    <div key={task} className="rounded-2xl bg-[#0b0b1d] p-4 text-white">
      {task}
    </div>
   ))}
  </div>
 )
}
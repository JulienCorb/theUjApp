import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/dashboard')({ component: Dashboard })

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>
      <p className="mt-4 text-lg">You are authenticated.</p>
    </div>
  )
}

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({ component: Signup })

function Signup() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">Sign Up</h1>
      <p className="mt-4 text-lg">Signup form will go here.</p>
    </div>
  )
}

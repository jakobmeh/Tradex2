import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import NewPostForm from '@/components/community/NewPostForm'

export default async function NewPostPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Share a trade</h1>
        <p className="mt-1 text-sm text-zinc-500">Your post will be reviewed by AI before going live</p>
      </div>
      <NewPostForm />
    </div>
  )
}

import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-session'
import LoginForm from './LoginForm'

export default async function AdminPage() {
  const authenticated = await getAdminSession()
  if (authenticated) redirect('/admin/dashboard')

  return <LoginForm />
}

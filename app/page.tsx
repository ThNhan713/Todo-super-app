import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function landingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    redirect(user ? '/dashboard' : '/login')
}
import Link from "next/link";
import { redirect } from 'next/navigation'
import { getClientUser } from "@/lib/utils/clientAndUser"
import { levelFromTotalXp } from '@/lib/logic/xp'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { supabase, user } = await getClientUser();
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const { level, xpIntoLevel, xpForNextLevel } = levelFromTotalXp(profile?.xp_total ?? 0)

    return (
        <div>
            <nav>
                <Link href="./todos">Todos</Link>
                <Link href="./habits">Habits</Link>
                <Link href="./stats">Stats</Link>
            </nav>
            <h1>Dashboard</h1>
            <p>Level {level} — {xpIntoLevel}/{xpForNextLevel} XP — {profile?.coins ?? 0} coins</p>
            {children}
        </div>
    )
}
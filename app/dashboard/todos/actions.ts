'use server'

import { getClientUser } from '@/lib/utils/clientAndUser'
import { revalidatePath } from 'next/cache'
import { rewardForTask } from '@/lib/logic/xp'

export async function createTodo(formData: FormData) {
    const { supabase, user } = await getClientUser();
    if (!user) return

    const title = formData.get('title') as string
    if (!title?.trim()) return

    const description = formData.get('description') as string

    const difficulty = formData.get('difficulty') as string
    if (!['trivial', 'easy', 'medium', 'hard', 'very hard'].includes(difficulty)) {
        return
    }
    const time = formData.get('time') as string
    if (!['quick', 'short', 'medium', 'long', 'very long'].includes(time)) {
        return
    }

    const reward = rewardForTask(difficulty, time)
    if (!reward) return
    const { xpReward, coinReward } = reward

    await supabase.from('todos').insert({ user_id: user.id, title, description, xp_reward: xpReward, coin_reward: coinReward, difficulty, time })
    revalidatePath('/dashboard')
}

export async function completeTodo(id: string) {
    const { supabase, user } = await getClientUser();
    if (!user) return

    const { data: todo } = await supabase.from('todos').select('*').eq('id', id).single()
    if (!todo || todo.status === 'completed') return

    await supabase
        .from('todos')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id)

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile) {
        await supabase
            .from('profiles')
            .update({
                xp_total: profile.xp_total + todo.xp_reward,
                coins: profile.coins + todo.coin_reward,
            })
            .eq('id', user.id)
    }

    revalidatePath('/dashboard')
}
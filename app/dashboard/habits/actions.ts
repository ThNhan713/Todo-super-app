'use server'

import { getClientUser } from '@/lib/utils/clientAndUser'
import { revalidatePath } from 'next/cache'
import { rewardForTask } from '@/lib/logic/xp'

export async function createHabit(formData: FormData) {
    const { supabase, user } = await getClientUser();
    if (!user) return;

    const title = formData.get("title") as string;
    if (!title?.trim()) return;

    const description = formData.get('description') as string;

    const habitType = formData.get("habit_type") as string;
    if (habitType !== "checkmark" && habitType !== "counter") return;

    const habitDirection = formData.get("direction") as string;
    if (habitDirection !== "at_least" && habitDirection !== "at_most") return;

    const period = formData.get("goal_period") as string;
    if (period !== "daily" && period !== "weekly") return;

    const targetDays = parseInt(formData.get("target_days") as string);

    const unit = formData.get("unit") as string;


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

    try {
        await supabase.from("habits").insert({
            user_id: user.id, title, description,
            habit_type: habitType, direction: habitDirection, period,
            target_days: targetDays, unit, xp_reward: xpReward, coin_reward: coinReward, difficulty, time
        })
        revalidatePath("/dashboard/habits");
    } catch (err) {
        console.error("Failed to create habit:", err);
    }
}

export async function incrementHabit(
    id: string,
    clientDateOrFormData?: string | FormData
) {
    const { supabase, user } = await getClientUser();
    if (!user) return

    const clientDate = typeof clientDateOrFormData === 'string'
        ? clientDateOrFormData
        : (clientDateOrFormData instanceof FormData && (clientDateOrFormData.get('clientDate') as string)) || new Date().toISOString().split('T')[0];

    // 1. Fetch the habit definition (note: table is 'habits')
    const { data: habit, error: habitError } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .single();

    if (habitError || !habit) return;

    // 2. Fetch today's existing log entry (if one exists)
    const { data: currentLog } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', id)
        .eq('log_date', clientDate)
        .maybeSingle();

    const prevValue = Number(currentLog?.value ?? 0);

    // 3. Compute the new value based on habit type
    const nextValue = habit.habit_type === 'checkmark'
        ? 1
        : prevValue + 1;

    // 4. Upsert the log row
    // Note: we include habit_type to satisfy the composite foreign key constraint
    const { error: logError } = await supabase
        .from('habit_logs')
        .upsert(
            {
                habit_id: habit.id,
                habit_type: habit.habit_type,
                log_date: clientDate,
                value: nextValue,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'habit_id,log_date' }
        );

    if (logError) return;

    // 5. Grant XP & coins
    const { data: profile } = await supabase
        .from('profiles')
        .select('xp_total, coins')
        .eq('id', user.id)
        .single();

    if (profile) {
        await supabase
            .from('profiles')
            .update({
                xp_total: (profile.xp_total ?? 0) + habit.xp_reward,
                coins: (profile.coins ?? 0) + habit.coin_reward,
            })
            .eq('id', user.id);
    }

    revalidatePath('/dashboard');
}
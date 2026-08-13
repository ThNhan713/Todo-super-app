import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { levelFromTotalXp } from '@/lib/logic/xp'
import { createTodo, completeTodo } from './actions'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const { data: todos } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const { level, xpIntoLevel, xpForNextLevel } = levelFromTotalXp(profile?.xp_total ?? 0)

    return (
        <div style={{ maxWidth: 480, margin: '80px auto' }}>
            <h1>Dashboard</h1>
            <p>Level {level} — {xpIntoLevel}/{xpForNextLevel} XP — {profile?.coins ?? 0} coins</p>

            <form action={createTodo} style={{ marginBottom: 16 }}>
                <input name="title" placeholder="New todo" required />
                <textarea name="description" rows={4} cols={30}></textarea>
                <fieldset>
                    <legend>Task difficulty: </legend>
                    <label>
                        <input type="radio" name="difficulty" value="trivial" required /> Trivial
                    </label>
                    <label>
                        <input type="radio" name="difficulty" value="easy" required /> Easy
                    </label>
                    <label>
                        <input type="radio" name="difficulty" value="medium" required /> Medium
                    </label>
                    <label>
                        <input type="radio" name="difficulty" value="hard" required /> Hard
                    </label>
                    <label>
                        <input type="radio" name="difficulty" value="very hard" required /> Very hard
                    </label>
                </fieldset>
                <fieldset>
                    <legend>Time to complete: </legend>
                    <label>
                        <input type="radio" name="time" value="quick" required /> Quick
                    </label>
                    <label>
                        <input type="radio" name="time" value="short" required /> Short
                    </label>
                    <label>
                        <input type="radio" name="time" value="medium" required /> Medium
                    </label>
                    <label>
                        <input type="radio" name="time" value="long" required /> Long
                    </label>
                    <label>
                        <input type="radio" name="time" value="very long" required /> Very Long
                    </label>
                </fieldset>
                <button type="submit">Add</button>
            </form>

            <ul>
                {todos?.map((todo) => (
                    <li key={todo.id}>
                        {todo.status === 'completed' ? (
                            <s>{todo.title}</s>
                        ) : (
                            <>
                                {todo.title}{' '}
                                <form action={completeTodo.bind(null, todo.id)} style={{ display: 'inline' }}>
                                    <button type="submit">Done</button>
                                </form>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    )
}
import { getClientUser } from "@/lib/utils/clientAndUser";
import { redirect } from "next/navigation";
import { createHabit, incrementHabit } from "./actions";

export default async function HabitsPage() {
    const { supabase, user } = await getClientUser();
    if (!user) redirect('/login');
    const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

    return (
        <div className="max-w-xl mx-auto p-6 space-y-8">
            <h1 className="text-2xl font-bold">Habits</h1>

            {/* Create Habit Form */}
            <form action={createHabit} className="border p-4 rounded-lg space-y-4">
                <h2 className="text-lg font-semibold">Create New Habit</h2>

                <div>
                    <label className="block font-medium mb-1" htmlFor="title">Title</label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        placeholder="Habit title (e.g. Morning Jog)"
                        required
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block font-medium mb-1" htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        placeholder="Optional description"
                        className="w-full border rounded p-2"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium mb-1" htmlFor="habit_type">Habit Type</label>
                        <select id="habit_type" name="habit_type" defaultValue="checkmark" className="w-full border rounded p-2">
                            <option value="checkmark">Checkmark (Done / Not Done)</option>
                            <option value="counter">Counter (Numeric)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium mb-1" htmlFor="direction">Direction</label>
                        <select id="direction" name="direction" defaultValue="at_least" className="w-full border rounded p-2">
                            <option value="at_least">At least (Positive habit)</option>
                            <option value="at_most">At most (Limit habit)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block font-medium mb-1" htmlFor="goal_period">Period</label>
                        <select id="goal_period" name="goal_period" defaultValue="daily" className="w-full border rounded p-2">
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-medium mb-1" htmlFor="target_days">Target Days</label>
                        <input
                            id="target_days"
                            name="target_days"
                            type="number"
                            min="1"
                            max="7"
                            defaultValue="7"
                            className="w-full border rounded p-2"
                        />
                    </div>

                    <div>
                        <label className="block font-medium mb-1" htmlFor="unit">Unit (Optional)</label>
                        <input
                            id="unit"
                            name="unit"
                            type="text"
                            placeholder="times, mins, etc."
                            className="w-full border rounded p-2"
                        />
                    </div>
                </div>

                <fieldset className="border p-3 rounded">
                    <legend className="font-medium px-1">Difficulty</legend>
                    <div className="flex flex-wrap gap-4 mt-1">
                        {['trivial', 'easy', 'medium', 'hard', 'very hard'].map((diff) => (
                            <label key={diff} className="flex items-center gap-1 capitalize">
                                <input type="radio" name="difficulty" value={diff} required defaultChecked={diff === 'easy'} />
                                {diff}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <fieldset className="border p-3 rounded">
                    <legend className="font-medium px-1">Time Commitment</legend>
                    <div className="flex flex-wrap gap-4 mt-1">
                        {['quick', 'short', 'medium', 'long', 'very long'].map((t) => (
                            <label key={t} className="flex items-center gap-1 capitalize">
                                <input type="radio" name="time" value={t} required defaultChecked={t === 'short'} />
                                {t}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 font-medium"
                >
                    Create Habit
                </button>
            </form>

            {/* Habit List */}
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Your Habits</h2>
                <ul className="space-y-2">
                    {habits?.map((habit) => (
                        <li key={habit.id} className="flex items-center justify-between border p-3 rounded">
                            <span>{habit.title}</span>
                            <form action={incrementHabit.bind(null, habit.id, new Date().toISOString().split('T')[0])}>
                                <button type="submit" className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded font-bold">
                                    +
                                </button>
                            </form>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
export function xpForLevel(level: number): number {
    // XP required to go from `level` to `level + 1`
    return 100 + 5 * (level - 1)
}

export function levelFromTotalXp(totalXp: number) {
    let level = 1
    let remaining = totalXp
    while (remaining >= xpForLevel(level)) {
        remaining -= xpForLevel(level)
        level++
    }
    return { level, xpIntoLevel: remaining, xpForNextLevel: xpForLevel(level) }
}

const difficultyMods: Record<string, number> = {
    trivial: 1,
    easy: 2,
    medium: 3,
    hard: 5,
    "very hard": 7,
};

const timeMods: Record<string, number> = {
    quick: 1,
    short: 3,
    medium: 8,
    long: 20,
    "very long": 50,
};

export function rewardForTask(difficulty: string, time: string) {
    const difMod = difficultyMods[difficulty];
    const timeMod = timeMods[time];

    if (!difMod || !timeMod) {
        return;
    }

    const xpReward = difMod * timeMod;
    const coinReward = difMod * timeMod;
    return { xpReward, coinReward }
}
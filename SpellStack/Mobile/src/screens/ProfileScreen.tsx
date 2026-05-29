import { useCallback, useState } from "react"
import { Image, StyleSheet, Text, View } from "react-native"
import { useFocusEffect } from "@react-navigation/native"

import { getLanguageStats, getProfileSummary, type LanguageStats, type ProfileSummary } from "../api/auth"
import { getAchievements, type Achievement } from "../api/achievements"
import { getGameHistory, type GameRunHistory } from "../api/gameSession"
import { useAuth } from "../auth/AuthContext"
import { Card } from "../components/Card"
import { Screen } from "../components/Screen"
import { StatPill } from "../components/StatPill"
import { getLanguageLabel } from "../data/languages"
import { useTheme } from "../theme/ThemeContext"

export function ProfileScreen() {
    const { user, profileImage } = useAuth()
    const { palette } = useTheme()
    const [summary, setSummary] = useState<ProfileSummary | null>(null)
    const [languageStats, setLanguageStats] = useState<LanguageStats[]>([])
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [history, setHistory] = useState<GameRunHistory[]>([])

    const loadProfile = useCallback(async () => {
        const [nextSummary, nextLanguageStats, nextAchievements, nextHistory] = await Promise.all([
            getProfileSummary().catch(() => null),
            getLanguageStats().catch(() => []),
            getAchievements().catch(() => []),
            getGameHistory(undefined, 5).catch(() => [])
        ])

        setSummary(nextSummary)
        setLanguageStats(nextLanguageStats)
        setAchievements(nextAchievements)
        setHistory(nextHistory)
    }, [])

    useFocusEffect(useCallback(() => {
        loadProfile()
    }, [loadProfile]))

    const unlockedAchievements = achievements.filter(achievement => achievement.unlocked)

    return (
        <Screen title="Profile" subtitle={user?.email}>
            <Card>
                <View style={styles.userRow}>
                    {profileImage ? <Image source={{ uri: profileImage }} style={styles.avatar} /> : <View style={[styles.avatarFallback, { backgroundColor: palette.primary }]}><Text style={styles.avatarText}>{user?.username?.[0]?.toUpperCase() ?? "S"}</Text></View>}
                    <View style={styles.userInfo}>
                        <Text style={styles.username}>{user?.username}</Text>
                        <Text style={styles.meta}>Favorite language: {user?.favoriteLanguage}</Text>
                    </View>
                </View>
            </Card>

            <View style={styles.stats}>
                <StatPill label="Runs" value={summary?.runsPlayed ?? 0} />
                <StatPill label="Best" value={summary?.longestStreak ?? 0} />
                <StatPill label="Words" value={summary?.wordsLearned ?? 0} />
            </View>

            <Card>
                <Text style={[styles.sectionTitle, { color: palette.accent }]}>Languages</Text>
                {languageStats.length === 0 ? <Text style={styles.muted}>No language stats yet.</Text> : languageStats.map(stat => (
                    <View key={stat.languageCode} style={styles.listRow}>
                        <Text style={styles.rowTitle}>{getLanguageLabel(stat.languageCode)}</Text>
                        <Text style={styles.rowMeta}>{stat.runsPlayed} runs - best streak {stat.longestStreak}</Text>
                    </View>
                ))}
            </Card>

            <Card>
                <Text style={[styles.sectionTitle, { color: palette.accent }]}>Achievements</Text>
                {unlockedAchievements.length === 0 ? <Text style={styles.muted}>No achievements unlocked yet.</Text> : unlockedAchievements.slice(0, 6).map(achievement => (
                    <View key={achievement.id} style={styles.listRow}>
                        <Text style={styles.rowTitle}>{achievement.name}</Text>
                        <Text style={styles.rowMeta}>{achievement.description}</Text>
                    </View>
                ))}
            </Card>

            <Card>
                <Text style={[styles.sectionTitle, { color: palette.accent }]}>Recent runs</Text>
                {history.length === 0 ? <Text style={styles.muted}>No runs recorded yet.</Text> : history.map(run => (
                    <View key={run.id} style={styles.listRow}>
                        <Text style={styles.rowTitle}>{run.deckName}</Text>
                        <Text style={styles.rowMeta}>{run.finalScore} score - {Math.round(run.accuracyPercent)}% accuracy</Text>
                    </View>
                ))}
            </Card>
        </Screen>
    )
}

const styles = StyleSheet.create({
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14
    },
    avatar: {
        width: 68,
        height: 68,
        borderRadius: 34
    },
    avatarFallback: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: "center",
        justifyContent: "center"
    },
    avatarText: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "900"
    },
    userInfo: {
        flex: 1,
        gap: 4
    },
    username: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "900",
        letterSpacing: 0
    },
    meta: {
        color: "rgba(255,255,255,0.64)",
        fontSize: 13,
        fontWeight: "700"
    },
    stats: {
        flexDirection: "row",
        gap: 8
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 0
    },
    muted: {
        color: "rgba(255,255,255,0.62)",
        lineHeight: 20
    },
    listRow: {
        gap: 3,
        paddingVertical: 4
    },
    rowTitle: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "900"
    },
    rowMeta: {
        color: "rgba(255,255,255,0.62)",
        fontSize: 13,
        lineHeight: 18
    }
})

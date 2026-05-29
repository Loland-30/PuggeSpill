import { useEffect } from "react"
import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { NavigationContainer, DarkTheme } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { BookOpen, ClipboardList, Settings, User } from "lucide-react-native"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { AuthProvider, useAuth } from "./src/auth/AuthContext"
import { I18nProvider } from "./src/i18n/I18nContext"
import { AuthScreen } from "./src/screens/AuthScreen"
import { DeckEditorScreen } from "./src/screens/DeckEditorScreen"
import { DecksScreen } from "./src/screens/DecksScreen"
import { PlayScreen } from "./src/screens/PlayScreen"
import { ProfileScreen } from "./src/screens/ProfileScreen"
import { SettingsScreen } from "./src/screens/SettingsScreen"
import { ThemeScreen } from "./src/screens/ThemeScreen"
import { TrialPlayScreen } from "./src/screens/TrialPlayScreen"
import { TrialsScreen } from "./src/screens/TrialsScreen"
import { ThemeProvider, useTheme } from "./src/theme/ThemeContext"
import type { MainTabParamList, RootStackParamList } from "./src/navigation/types"

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tabs = createBottomTabNavigator<MainTabParamList>()

function MainTabs() {
    const { palette } = useTheme()

    return (
        <Tabs.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: palette.accent,
                tabBarInactiveTintColor: "rgba(255,255,255,0.58)",
                tabBarStyle: {
                    backgroundColor: "#020617",
                    borderTopColor: "rgba(255,255,255,0.12)",
                    minHeight: 62,
                    paddingTop: 8
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "800"
                },
                tabBarIcon: ({ color, size }) => {
                    if (route.name === "Decks") return <BookOpen color={color} size={size} />
                    if (route.name === "Trials") return <ClipboardList color={color} size={size} />
                    if (route.name === "Profile") return <User color={color} size={size} />
                    return <Settings color={color} size={size} />
                }
            })}
        >
            <Tabs.Screen name="Decks" component={DecksScreen} />
            <Tabs.Screen name="Trials" component={TrialsScreen} />
            <Tabs.Screen name="Profile" component={ProfileScreen} />
            <Tabs.Screen name="Settings" component={SettingsScreen} />
        </Tabs.Navigator>
    )
}

function AppNavigator() {
    const { user, loading } = useAuth()
    const { reloadTheme, palette } = useTheme()

    useEffect(() => {
        if (user) reloadTheme()
    }, [reloadTheme, user])

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color="#ffffff" size="large" />
                <Text style={styles.loadingText}>Loading SpellStack</Text>
            </View>
        )
    }

    if (!user) return <AuthScreen />

    return (
        <NavigationContainer
            theme={{
                ...DarkTheme,
                colors: {
                    ...DarkTheme.colors,
                    primary: palette.primary,
                    background: "#020617",
                    card: "#020617",
                    border: "rgba(255,255,255,0.12)",
                    text: "#ffffff"
                }
            }}
        >
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: "#020617" }
                }}
            >
                <Stack.Screen name="MainTabs" component={MainTabs} />
                <Stack.Screen name="DeckEditor" component={DeckEditorScreen} />
                <Stack.Screen name="Play" component={PlayScreen} />
                <Stack.Screen name="TrialPlay" component={TrialPlayScreen} />
                <Stack.Screen name="Theme" component={ThemeScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default function App() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <ThemeProvider>
                    <I18nProvider>
                        <StatusBar style="light" />
                        <AppNavigator />
                    </I18nProvider>
                </ThemeProvider>
            </AuthProvider>
        </SafeAreaProvider>
    )
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: "#020617",
        alignItems: "center",
        justifyContent: "center",
        gap: 12
    },
    loadingText: {
        color: "rgba(255,255,255,0.72)",
        fontWeight: "800"
    }
})

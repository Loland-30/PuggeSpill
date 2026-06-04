import { Alert, StyleSheet, Switch, Text, View } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Brush, LogOut } from "lucide-react-native"
import { useState } from "react"

import { API_URL } from "../api/config"
import { useAuth } from "../auth/AuthContext"
import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { Screen } from "../components/Screen"
import { SegmentedControl } from "../components/SegmentedControl"
import { useI18n } from "../i18n/I18nContext"
import type { AppLanguageCode } from "../i18n/localeMap"
import type { RootStackParamList } from "../navigation/types"

export function SettingsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
    const { logoutUser } = useAuth()
    const { appLanguage, setAppLanguage } = useI18n()
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [hintsEnabled, setHintsEnabled] = useState(true)

    const logout = () => {
        Alert.alert("Sign out", "Sign out of SpellStack?", [
            { text: "Cancel", style: "cancel" },
            { text: "Sign out", style: "destructive", onPress: logoutUser }
        ])
    }

    return (
        <Screen title="Settings" subtitle="Mobile app preferences.">
            <Card>
                <SettingRow label="Sound effects" value={soundEnabled} onValueChange={setSoundEnabled} />
                <SettingRow label="Show word hints" value={hintsEnabled} onValueChange={setHintsEnabled} />
            </Card>

            <Card>
                <Text style={styles.sectionTitle}>Appearance</Text>
                <SegmentedControl<AppLanguageCode>
                    value={appLanguage}
                    onChange={setAppLanguage}
                    options={[
                        { label: "EN", value: "en" },
                        { label: "NO", value: "no" },
                        { label: "ES", value: "es" },
                        { label: "JA", value: "ja" }
                    ]}
                />
                <Button title="Theme selection" onPress={() => navigation.navigate("Theme")} icon={<Brush color="#ffffff" size={18} />} />
            </Card>

            <Card>
                <Text style={styles.sectionTitle}>API endpoint</Text>
                <Text style={styles.apiUrl}>{API_URL}</Text>
                <Text style={styles.muted}>Set EXPO_PUBLIC_API_URL before starting Expo to target a physical device LAN address.</Text>
            </Card>

            <Button title="Sign out" variant="danger" onPress={logout} icon={<LogOut color="#ffffff" size={18} />} />
        </Screen>
    )
}

function SettingRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
    return (
        <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{label}</Text>
            <Switch value={value} onValueChange={onValueChange} />
        </View>
    )
}

const styles = StyleSheet.create({
    settingRow: {
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    settingLabel: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "800"
    },
    sectionTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "900"
    },
    apiUrl: {
        color: "#ffffff",
        fontSize: 13,
        fontWeight: "800"
    },
    muted: {
        color: "rgba(255,255,255,0.62)",
        lineHeight: 20
    }
})

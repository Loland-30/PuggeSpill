import { useState } from "react"
import { Image, StyleSheet, Text, View } from "react-native"

import { useAuth } from "../auth/AuthContext"
import heroImage from "../assets/hero.png"
import { Button } from "../components/Button"
import { Card } from "../components/Card"
import { Screen } from "../components/Screen"
import { SegmentedControl } from "../components/SegmentedControl"
import { TextField } from "../components/TextField"

export function AuthScreen() {
    const { loginUser, registerUser } = useAuth()
    const [mode, setMode] = useState<"login" | "register">("login")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [favoriteLanguage, setFavoriteLanguage] = useState("Spanish")
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const submit = async () => {
        setError(null)
        setSubmitting(true)
        try {
            if (mode === "login") {
                await loginUser(email.trim(), password)
            } else {
                await registerUser(username.trim(), email.trim(), password, favoriteLanguage)
            }
        } catch (authError) {
            setError(authError instanceof Error ? authError.message : "Something went wrong")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Screen scroll>
            <View style={styles.heroWrap}>
                <Image source={heroImage} style={styles.hero} resizeMode="contain" />
                <Text style={styles.logo}>SpellStack</Text>
                <Text style={styles.tagline}>Build decks, battle through words, keep the streak alive.</Text>
            </View>

            <Card>
                <SegmentedControl
                    value={mode}
                    onChange={setMode}
                    options={[
                        { label: "Log in", value: "login" },
                        { label: "Register", value: "register" }
                    ]}
                />

                {mode === "register" ? (
                    <>
                        <TextField label="Username" value={username} onChangeText={setUsername} placeholder="spellcaster" />
                        <TextField label="Favorite language" value={favoriteLanguage} onChangeText={setFavoriteLanguage} placeholder="Spanish" />
                    </>
                ) : null}

                <TextField
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                />
                <TextField
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry
                    textContentType={mode === "login" ? "password" : "newPassword"}
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Button
                    title={mode === "login" ? "Log in" : "Create account"}
                    onPress={submit}
                    loading={submitting}
                    disabled={!email || !password || (mode === "register" && !username)}
                />
            </Card>
        </Screen>
    )
}

const styles = StyleSheet.create({
    heroWrap: {
        alignItems: "center",
        gap: 8,
        paddingTop: 18,
        paddingBottom: 6
    },
    hero: {
        width: "82%",
        height: 190
    },
    logo: {
        color: "#ffffff",
        fontSize: 36,
        fontWeight: "900",
        letterSpacing: 0
    },
    tagline: {
        color: "rgba(255,255,255,0.68)",
        fontSize: 14,
        lineHeight: 20,
        textAlign: "center",
        maxWidth: 320
    },
    error: {
        color: "#fca5a5",
        fontSize: 13,
        fontWeight: "700"
    }
})

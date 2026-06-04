const { spawn } = require("child_process")

function normalizeWindowsDrive(cwd) {
    return cwd.replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`)
}

const cwd = process.platform === "win32"
    ? normalizeWindowsDrive(process.cwd())
    : process.cwd()

if (!process.env.REACT_NATIVE_PACKAGER_HOSTNAME && process.env.EXPO_PUBLIC_API_URL) {
    try {
        process.env.REACT_NATIVE_PACKAGER_HOSTNAME = new URL(process.env.EXPO_PUBLIC_API_URL).hostname
    } catch {
        // Expo can still infer the host if the API URL is not parseable.
    }
}

const args = ["expo", "start", ...process.argv.slice(2)]
const child = spawn("npx", args, {
    cwd,
    env: process.env,
    shell: process.platform === "win32",
    stdio: "inherit"
})

child.on("exit", code => {
    process.exit(code ?? 0)
})

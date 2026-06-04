# SpellStack Mobile

Expo React Native app for the existing SpellStack backend.

This app is pinned to Expo SDK 54 so it can run in the current app-store version of Expo Go. Newer Expo SDKs may require a development build or a matching Expo Go beta/TestFlight build.

## Run

Start the ASP.NET backend first:

```powershell
cd ..\Backend
dotnet run --launch-profile http
```

Then start Expo:

```powershell
cd ..\Mobile
npm run start
```

On Windows, prefer the Expo Go helper because it normalizes the drive letter before Metro starts:
It also derives `REACT_NATIVE_PACKAGER_HOSTNAME` from `EXPO_PUBLIC_API_URL`, so the QR code points Expo Go at your PC's LAN IP instead of `127.0.0.1`.

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.1.61:5084/api"
npm run start:go
```

## API URL

The mobile app defaults to:

- Android emulator: `http://10.0.2.2:5084/api`
- iOS simulator/web: `http://localhost:5084/api`

For a real phone, start Expo with your PC's LAN IP:

```powershell
$env:ASPNETCORE_URLS="http://0.0.0.0:5084"
cd ..\Backend
dotnet run

cd ..\Mobile
$env:EXPO_PUBLIC_API_URL="http://192.168.x.x:5084/api"
npm run start:lan
```

Make sure the phone is on the same Wi-Fi network and that your firewall allows local traffic to port `5084`.

## Useful Scripts

```powershell
npm run start
npm run start:clear
npm run start:lan
npm run start:go
npm run android
npm run ios
npm run web
npm run typecheck
```

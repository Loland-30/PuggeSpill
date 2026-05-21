import { API_URL, authHeaders, type AuthUser } from "./auth"

async function parseProfileImageResponse(response: Response): Promise<AuthUser> {
    if (!response.ok) throw new Error(await response.text())
    return response.json()
}

export async function uploadProfileImage(file: File): Promise<AuthUser> {
    const formData = new FormData()
    formData.append("image", file)

    const response = await fetch(`${API_URL}/profile/image`, {
        method: "POST",
        headers: authHeaders(),
        body: formData
    })

    return parseProfileImageResponse(response)
}

export async function deleteProfileImage(): Promise<AuthUser> {
    const response = await fetch(`${API_URL}/profile/image`, {
        method: "DELETE",
        headers: authHeaders()
    })

    return parseProfileImageResponse(response)
}

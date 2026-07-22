import { authHeaders } from "./auth"
import { API_URL } from "./config"

export interface UpdateListItem {
    id: number
    slug: string
    version: string
    title: string
    summary: string
    category: string
    status: string
    publishedAt: string | null
}

export interface UpdateDetails extends UpdateListItem {
    content: string
    createdAt: string
    updatedAt: string
}

export interface UpdatePostInput {
    slug?: string | null
    version: string
    title: string
    summary: string
    content: string
    category: string
    status: string
    isPublished: boolean
    publishedAt?: string | null
}

export class UpdatesApiError extends Error {
    status: number

    constructor(message: string, status: number) {
        super(message)
        this.name = "UpdatesApiError"
        this.status = status
    }
}

async function readResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
    if (!response.ok) {
        const message = (await response.text()).trim()
        throw new UpdatesApiError(message || fallbackMessage, response.status)
    }

    if (response.status === 204) return undefined as T
    return response.json() as Promise<T>
}

export async function getUpdates(signal?: AbortSignal): Promise<UpdateListItem[]> {
    const response = await fetch(`${API_URL}/updates`, { signal })
    return readResponse(response, "Could not load updates.")
}

export async function getUpdateBySlug(slug: string, signal?: AbortSignal): Promise<UpdateDetails> {
    const response = await fetch(`${API_URL}/updates/${encodeURIComponent(slug)}`, { signal })
    return readResponse(response, "Could not load this update.")
}

export async function createUpdate(input: UpdatePostInput): Promise<UpdateDetails> {
    const response = await fetch(`${API_URL}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(input)
    })
    return readResponse(response, "Could not create the update.")
}

export async function updateUpdate(id: number, input: UpdatePostInput): Promise<UpdateDetails> {
    const response = await fetch(`${API_URL}/updates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(input)
    })
    return readResponse(response, "Could not update the post.")
}

export async function deleteUpdate(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/updates/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    })
    await readResponse<void>(response, "Could not delete the update.")
}

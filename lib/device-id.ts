"use client"

import { OfflineCache } from "./offline-cache"

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return ""

  const existingId = localStorage.getItem("device_id")
  if (existingId) {
    OfflineCache.setDeviceId(existingId)
    return existingId
  }

  const newId = crypto.randomUUID()
  localStorage.setItem("device_id", newId)
  OfflineCache.setDeviceId(newId)
  return newId
}

export function getDeviceId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("device_id")
}

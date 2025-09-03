export interface CachedDailyData {
  prompts: any[]
  completions: string[]
  date: string
  timestamp: number
}

export class OfflineCache {
  private static CACHE_KEY = "wellbeing_daily_cache"
  private static DEVICE_ID_KEY = "wellbeing_device_id"

  static getTodayDateString(): string {
    // Use local timezone for day boundary
    return new Date().toLocaleDateString("en-CA") // YYYY-MM-DD format in local timezone
  }

  static getCachedData(): CachedDailyData | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      if (!cached) return null

      const data = JSON.parse(cached) as CachedDailyData
      const today = this.getTodayDateString()

      // Check if cached data is for today
      if (data.date !== today) {
        this.clearCache()
        return null
      }

      return data
    } catch (error) {
      console.error("[v0] Error reading cache:", error)
      return null
    }
  }

  static setCachedData(prompts: any[], completions: string[]): void {
    try {
      const data: CachedDailyData = {
        prompts,
        completions,
        date: this.getTodayDateString(),
        timestamp: Date.now(),
      }
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error("[v0] Error writing cache:", error)
    }
  }

  static updateCompletions(completions: string[]): void {
    const cached = this.getCachedData()
    if (cached) {
      cached.completions = completions
      cached.timestamp = Date.now()
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cached))
    }
  }

  static clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY)
  }

  static getDeviceId(): string | null {
    return localStorage.getItem(this.DEVICE_ID_KEY)
  }

  static setDeviceId(deviceId: string): void {
    localStorage.setItem(this.DEVICE_ID_KEY, deviceId)
  }
}

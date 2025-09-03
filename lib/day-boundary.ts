export class DayBoundaryManager {
  private static LAST_CHECK_KEY = "wellbeing_last_day_check"

  static checkDayBoundary(): boolean {
    const today = new Date().toLocaleDateString("en-CA") // Local timezone
    const lastCheck = localStorage.getItem(this.LAST_CHECK_KEY)

    if (lastCheck !== today) {
      localStorage.setItem(this.LAST_CHECK_KEY, today)
      return true // Day has changed
    }

    return false // Same day
  }

  static setupMidnightListener(callback: () => void): () => void {
    const checkMidnight = () => {
      if (this.checkDayBoundary()) {
        callback()
      }
    }

    // Check every minute for day boundary
    const interval = setInterval(checkMidnight, 60000)

    // Return cleanup function
    return () => clearInterval(interval)
  }
}

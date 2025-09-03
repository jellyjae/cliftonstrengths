"use client"

import { useEffect, useState } from "react"
import Confetti from "react-confetti"

interface ConfettiCelebrationProps {
  /** Whether to show the confetti animation */
  show: boolean
  /** Duration in milliseconds for the confetti animation */
  duration?: number
  /** Callback when confetti animation completes */
  onComplete?: () => void
}

export function ConfettiCelebration({ 
  show, 
  duration = 3000, 
  onComplete 
}: ConfettiCelebrationProps) {
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const updateDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onComplete?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [show, duration, onComplete])

  if (!show || windowDimensions.width === 0) {
    return null
  }

  return (
    <Confetti
      width={windowDimensions.width}
      height={windowDimensions.height}
      recycle={false}
      numberOfPieces={200}
      gravity={0.3}
      initialVelocityY={20}
      colors={[
        "#3b82f6", // blue
        "#10b981", // emerald
        "#f59e0b", // amber
        "#ef4444", // red
        "#8b5cf6", // violet
        "#06b6d4", // cyan
        "#84cc16", // lime
        "#f97316", // orange
      ]}
    />
  )
}

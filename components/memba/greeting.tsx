"use client"

export default function Greeting() {
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? "morning" : currentHour < 18 ? "afternoon" : "evening"

  return greeting
}

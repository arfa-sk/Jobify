"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export interface UserProfile {
  id?: string
  firstName: string
  lastName: string
  email: string
  role: string
  location: string
  bio?: string
}

const DEFAULT_USER: UserProfile = {
  id: "000000000000000000000001",
  firstName: "Alex",
  lastName: "Rivera",
  email: "alex@career.com",
  role: "Candidate",
  location: "San Francisco, CA",
}

interface UserContextType {
  user: UserProfile
  updateUser: (newDetails: Partial<UserProfile>) => void
  isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("jobify_user")
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // Self-heal: Ensure ID is always present even if old storage is missing it
        if (!parsed.id) parsed.id = DEFAULT_USER.id;
        setUser(parsed)
      } catch (e) {
        console.error("Failed to parse stored user", e)
      }
    }
    setIsLoading(false)
  }, [])

  const updateUser = (newDetails: Partial<UserProfile>) => {
    const updatedUser = { ...user, ...newDetails }
    setUser(updatedUser)
    localStorage.setItem("jobify_user", JSON.stringify(updatedUser))
  }

  return (
    <UserContext.Provider value={{ user, updateUser, isLoading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

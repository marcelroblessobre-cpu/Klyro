import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) {
      // Create profile if doesn't exist
      await createProfile(userId)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  async function createProfile(userId) {
    const { data: authUser } = await supabase.auth.getUser()
    const { data } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: authUser.user?.email,
        xp: 0,
        streak: 0,
        level: 1,
      })
      .select()
      .single()
    setProfile(data)
  }

  async function refreshProfile() {
    if (!user) return
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (data) setProfile(data)
  }

  const value = { user, profile, loading, refreshProfile }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

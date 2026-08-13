'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }
    router.push("/dashboard")
    router.refresh()
  }
  async function handleSignUp() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      return
    }
    setLoading(false)
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 320, margin: '80px auto' }}>
      <h1>Log in</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <button onClick={handleSignIn} disabled={loading}>Sign in</button>
      <button onClick={handleSignUp} disabled={loading}>Sign up</button>
    </div>
  )
    ;
}

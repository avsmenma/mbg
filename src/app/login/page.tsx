'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErr('')
    const { error } = await createClient().auth.signInWithPassword({
      email,
      password: pw,
    })
    if (error) {
      setErr(error.message)
      setLoading(false)
    } else {
      router.refresh()
      router.push('/dashboard')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--paper)' }}
    >
      <form
        onSubmit={submit}
        className="max-w-sm w-full mx-auto space-y-4 p-8 rounded-xl shadow-md"
        style={{ backgroundColor: 'var(--paper-elev)', border: '1px solid var(--line)' }}
      >
        <div className="text-center mb-2">
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: 'var(--font-display), system-ui, sans-serif', color: 'var(--ink)' }}
          >
            Masuk
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--moss)' }}>Sistem Manajemen MBG</p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Email
          </label>
          <input
            type="email"
            className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C77D12]"
            placeholder="nama@contoh.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Kata sandi
          </label>
          <input
            type="password"
            className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C77D12]"
            placeholder="••••••••"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
        </div>

        {err && (
          <p
            className="text-sm p-2 rounded"
            style={{ backgroundColor: '#F5D5CF', color: 'var(--clay)' }}
          >
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center py-2.5 disabled:opacity-60"
        >
          {loading ? 'Memuat...' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}

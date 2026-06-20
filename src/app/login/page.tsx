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
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={submit}
        className="max-w-sm w-full mx-auto space-y-4 p-8 bg-white rounded-xl shadow-md"
      >
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Masuk</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem Manajemen MBG</p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800"
            placeholder="nama@contoh.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Kata sandi
          </label>
          <input
            type="password"
            className="border border-gray-300 w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800"
            placeholder="••••••••"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
        </div>

        {err && (
          <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{err}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-green-800 hover:bg-green-900 disabled:opacity-60 text-white w-full p-2 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Memuat...' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'

export default function SheetPage() {
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const data = params.get('data')
      if (!data) { setError('データが見つかりません'); return }
      const decoded = decodeURIComponent(atob(data))
      setHtml(decoded)
    } catch (e) {
      setError('データの読み込みに失敗しました')
    }
  }, [])

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#c0392b' }}>
      <p>⚠️ {error}</p>
    </div>
  )

  if (!html) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#6B7B79' }}>
      <p>読み込み中...</p>
    </div>
  )

  return (
    <div>
      <div className="no-print" style={{ background: '#1A7A6E', color: 'white', padding: '12px 20px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <span style={{ fontSize: 14 }}>📄 フィードバックシート</span>
        <button onClick={() => window.print()} style={{ background: '#D4892A', color: 'white', border: 'none', padding: '8px 20px', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>
          🖨️ 印刷する
        </button>
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <style>{`
        @media print { .no-print { display: none !important; } }
      `}</style>
    </div>
  )
}

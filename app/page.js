'use client'
import { useState, useRef } from 'react'

export default function Home() {
  const [customerName, setCustomerName] = useState('')
  const [storeName, setStoreName] = useState('Anchor Life Fitness 貴生川店')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultHtml, setResultHtml] = useState(null)
  const [remaining, setRemaining] = useState(null)
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    setImage(file)
    setResultHtml(null)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!image) { setError('写真を選択してください'); return }
    if (!customerName.trim()) { setError('お客様名を入力してください'); return }

    setLoading(true)
    setError('')
    setResultHtml(null)

    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('customerName', customerName)
      formData.append('storeName', storeName)

      const res = await fetch('/api/generate', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'エラーが発生しました')
        return
      }

      setResultHtml(data.html)
      if (data.remaining !== undefined) setRemaining(data.remaining)
    } catch (e) {
      setError('通信エラーが発生しました: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const openPrint = () => {
    const win = window.open('', '_blank')
    win.document.write(resultHtml)
    win.document.close()
    setTimeout(() => win.print(), 600)
  }

  const STORES = [
    'Anchor Life Fitness 貴生川店',
    'Muscle Quality 草津店',
    'Muscle Quality 大津店',
  ]

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <div style={styles.logoMark}></div>
            <span style={styles.logoText}>フィードバックシート生成</span>
          </div>
        </div>
      </div>

      <div style={styles.container}>

        {/* Card: Form */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>体組成データを読み込む</h2>
          <p style={styles.cardSub}>TANITAなどの測定結果を撮影してアップロードしてください</p>

          {/* Store selector */}
          <div style={styles.field}>
            <label style={styles.label}>店舗</label>
            <select
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              style={styles.select}
            >
              {STORES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Customer name */}
          <div style={styles.field}>
            <label style={styles.label}>お客様名</label>
            <input
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="例：山田 太郎"
              style={styles.input}
            />
          </div>

          {/* Image upload */}
          <div style={styles.field}>
            <label style={styles.label}>体組成計の写真</label>
            <div style={styles.uploadArea} onClick={() => fileRef.current?.click()}>
              {preview ? (
                <img src={preview} alt="preview" style={styles.preview} />
              ) : (
                <div style={styles.uploadPlaceholder}>
                  <div style={styles.uploadIcon}>📷</div>
                  <p style={styles.uploadText}>タップして写真を選択</p>
                  <p style={styles.uploadSub}>またはカメラで撮影</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            {/* Camera button for mobile */}
            <button
              style={styles.cameraBtn}
              onClick={() => cameraRef.current?.click()}
            >
              📸 カメラで撮影する
            </button>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>⚠️ {error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <span>⏳ AIが解析中...（10〜20秒）</span>
            ) : (
              <span>✨ フィードバックシートを生成する</span>
            )}
          </button>

          {remaining !== null && (
            <p style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: remaining <= 5 ? '#c0392b' : '#6B7B79' }}>
              本日の残り利用回数：<strong>{remaining} / 20回</strong>
              {remaining <= 5 && '　⚠️ 残りわずかです'}
            </p>
          )}
        </div>

        {/* Loading animation */}
        {loading && (
          <div style={styles.loadingCard}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>AIが体組成データを読み取っています...</p>
            <p style={styles.loadingTextSub}>フィードバックシートを作成中です</p>
          </div>
        )}

        {/* Result */}
        {resultHtml && !loading && (
          <div style={styles.resultCard}>
            <div style={styles.resultHeader}>
              <div>
                <h3 style={styles.resultTitle}>✅ 生成完了！</h3>
                <p style={styles.resultSub}>{customerName}様のフィードバックシート</p>
              </div>
              <div style={styles.resultActions}>
                <button onClick={openPrint} style={styles.printBtn}>
                  🖨️ 印刷する
                </button>
              </div>
            </div>
            <iframe
              srcDoc={resultHtml}
              style={styles.iframe}
              title="フィードバックシート"
            />
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  )
}

const TEAL = '#1A7A6E'
const GOLD = '#D4892A'
const DARK = '#1E2D2B'

const styles = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0faf9 0%, #fef9f0 100%)',
    fontFamily: "'Hiragino Sans', 'Yu Gothic', sans-serif",
  },
  header: {
    background: DARK,
    borderBottom: `3px solid ${GOLD}`,
    padding: '0',
  },
  headerInner: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '14px 20px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoMark: {
    width: 8,
    height: 32,
    background: TEAL,
    borderRadius: 2,
  },
  logoText: {
    color: '#A8D5CE',
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '0.5px',
  },
  container: {
    maxWidth: 680,
    margin: '0 auto',
    padding: '24px 16px 48px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  card: {
    background: 'white',
    borderRadius: 16,
    padding: '28px 24px',
    boxShadow: '0 2px 16px rgba(26,122,110,0.08)',
    border: '1px solid #e8f5f3',
  },
  cardTitle: {
    color: DARK,
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 6,
  },
  cardSub: {
    color: '#6B7B79',
    fontSize: 13,
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    color: DARK,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    border: `1.5px solid #A8D5CE`,
    borderRadius: 10,
    fontSize: 15,
    color: DARK,
    background: 'white',
    outline: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: `1.5px solid #A8D5CE`,
    borderRadius: 10,
    fontSize: 15,
    color: DARK,
    background: 'white',
    outline: 'none',
  },
  uploadArea: {
    border: `2px dashed #A8D5CE`,
    borderRadius: 12,
    minHeight: 180,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    background: '#f8fffe',
    marginBottom: 10,
  },
  uploadPlaceholder: {
    textAlign: 'center',
    padding: 24,
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  uploadText: {
    color: TEAL,
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 4,
  },
  uploadSub: {
    color: '#6B7B79',
    fontSize: 13,
  },
  preview: {
    maxWidth: '100%',
    maxHeight: 320,
    objectFit: 'contain',
    display: 'block',
  },
  cameraBtn: {
    width: '100%',
    padding: '12px',
    background: 'white',
    border: `1.5px solid ${TEAL}`,
    borderRadius: 10,
    color: TEAL,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  errorBox: {
    background: '#fff2f2',
    border: '1px solid #f4aaaa',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 16,
  },
  submitBtn: {
    width: '100%',
    padding: '16px',
    background: TEAL,
    color: 'white',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 4,
    letterSpacing: '0.3px',
  },
  loadingCard: {
    background: 'white',
    borderRadius: 16,
    padding: '36px 24px',
    textAlign: 'center',
    boxShadow: '0 2px 16px rgba(26,122,110,0.08)',
  },
  spinner: {
    width: 48,
    height: 48,
    border: `4px solid #E8F5F3`,
    borderTop: `4px solid ${TEAL}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    color: DARK,
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 6,
  },
  loadingTextSub: {
    color: '#6B7B79',
    fontSize: 13,
  },
  resultCard: {
    background: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 2px 16px rgba(26,122,110,0.08)',
    border: `1px solid #A8D5CE`,
  },
  resultHeader: {
    background: '#E8F5F3',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid #A8D5CE`,
    flexWrap: 'wrap',
    gap: 12,
  },
  resultTitle: {
    color: TEAL,
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 2,
  },
  resultSub: {
    color: '#6B7B79',
    fontSize: 13,
  },
  resultActions: {
    display: 'flex',
    gap: 10,
  },
  printBtn: {
    padding: '10px 20px',
    background: GOLD,
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  iframe: {
    width: '100%',
    height: 800,
    border: 'none',
    display: 'block',
  },
}

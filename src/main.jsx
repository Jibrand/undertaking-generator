import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { layout, letterhead, makePdf, page } from './undertaking'
import './style.css'

const fields = [
  { name: 'party', label: 'Party name', placeholder: 'Enter company name', maxLength: 120 },
  { name: 'ntn', label: 'NTN', placeholder: 'Enter tax number', maxLength: 32 },
  { name: 'invoice', label: 'Invoice number', placeholder: 'e.g. 400', maxLength: 40 },
  { name: 'date', label: 'Invoice date', type: 'date' },
]

const mobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)


function App() {
  const [values, setValues] = useState({ party: '', ntn: '', invoice: '', date: '' })
  const [image, setImage] = useState(null)
  const [notice, setNotice] = useState('')
  const documentLayout = layout(values)
  const ready = Object.values(values).every(value => value.trim()) && documentLayout.fits && image

  useEffect(() => {
    const asset = new Image()
    asset.onload = () => setImage(asset)
    asset.onerror = () => setNotice('The letterhead could not load. Refresh and try again.')
    asset.src = letterhead
    return () => {
      asset.onload = null
      asset.onerror = null
    }
  }, [])

  async function exportPdf(share) {
    if (!ready) return
    setNotice('')
    try {
      const file = makePdf(documentLayout, image, values)
      if (share && typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
          return
        } catch (error) {
          if (error.name === 'AbortError') return
        }
      }
      const url = URL.createObjectURL(file)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
      if (!share) {
        setNotice('PDF downloaded.')
      } else if (!window.isSecureContext) {
        setNotice('PDF downloaded. Open it in Files and tap Share. Direct sharing requires HTTPS.')
      } else {
        setNotice('PDF downloaded. Open it in Files and tap Share to send via WhatsApp or another app.')
      }
    } catch {
      setNotice('The PDF could not be exported. Please try again.')
    }
  }

  return (
    <>
      <header className="brand-bar">
        <div className="shell flex items-center gap-3">
          <img width="42" height="42" src={import.meta.env.BASE_URL + 'icon-192.png'} alt="" />
          <span className="font-semibold tracking-tight">Al-Marium International</span>
        </div>
      </header>
      <main className="shell workspace">
        <section className="editor">
          <h1>New undertaking</h1>
          <form onSubmit={event => { event.preventDefault(); exportPdf(false) }}>
            <div className="fields">
              {fields.map(({ name, label, ...attributes }) => (
                <label key={name} className={name === 'party' || name === 'ntn' ? 'wide' : undefined}>
                  {label}
                  <input {...attributes} value={values[name]} required onChange={event => {
                    setValues({ ...values, [name]: event.target.value })
                    setNotice('')
                  }} />
                </label>
              ))}
            </div>
            {!documentLayout.fits && <p role="alert">Shorten the party name or invoice details to fit one page.</p>}
            <div className="actions">
              <button className="primary" type="submit" disabled={!ready}>Download PDF</button>
              {mobileDevice && <button type="button" disabled={!ready} onClick={() => exportPdf(true)}>Share PDF</button>}
            </div>
            <p role="status" className="notice">{notice}</p>
          </form>
        </section>
        <section className="preview min-w-0">
          <h2>A4 preview</h2>
          <svg className="paper block w-full bg-white" viewBox={`0 0 ${page.width} ${page.height}`}
            role="img" aria-label="Preview of the undertaking">
            <image href={letterhead} width={page.width} height={page.height} preserveAspectRatio="none" />
            <g fontFamily="Times New Roman, Times, serif">
              <text x="105" y="113" textAnchor="middle" fontWeight="bold" fontSize="6.35">UNDERTAKING</text>
              <line x1="77" y1="114.3" x2="133" y2="114.3" stroke="black" strokeWidth=".4" />
              {documentLayout.lines.map(line => (
                <text key={line.y} y={line.y} fontSize={documentLayout.fontSize * 25.4 / 72}>
                  {line.words.map(word => (
                    <tspan key={word.x} x={word.x} textLength={word.width}
                      fontWeight={word.bold ? 'bold' : undefined}
                      lengthAdjust="spacingAndGlyphs">{word.text}</tspan>
                  ))}
                </text>
              ))}
            </g>
          </svg>
        </section>
      </main>
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)

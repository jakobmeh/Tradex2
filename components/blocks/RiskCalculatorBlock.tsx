'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BlockContent } from '@/lib/blocks'

type AssetMode = 'crypto' | 'forex' | 'indices'

type ExtractionResponse = {
  mode?: AssetMode
  account?: number | null
  risk?: number | null
  entry?: number | null
  sl?: number | null
  tp?: number | null
  pipValue?: number | null
  pointValue?: number | null
  error?: string
}

const MODES: { value: AssetMode; label: string }[] = [
  { value: 'crypto', label: 'Crypto' },
  { value: 'forex', label: 'Forex' },
  { value: 'indices', label: 'Indices' },
]

type Fields = {
  account: string
  risk: string
  entry: string
  sl: string
  tp: string
  pipValue: string
  pointValue: string
}

const DEFAULTS: Fields = {
  account: '',
  risk: '1',
  entry: '',
  sl: '',
  tp: '',
  pipValue: '10',
  pointValue: '1',
}

function parseNumber(value: string) {
  const cleaned = value.trim().replace(',', '.')
  const x = parseFloat(cleaned)
  return Number.isFinite(x) ? x : null
}

function fmt(v: number, decimals = 2) {
  return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function toFieldValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return ''
}

function calcCrypto(f: Fields) {
  const account = parseNumber(f.account)
  const risk = parseNumber(f.risk)
  const entry = parseNumber(f.entry)
  const sl = parseNumber(f.sl)
  const tp = parseNumber(f.tp)
  if (!account || !risk || !entry || !sl || !tp) return null

  const riskDollar = account * (risk / 100)
  const slDiff = Math.abs(entry - sl)
  if (slDiff === 0) return null
  const positionSize = riskDollar / slDiff
  const tpDiff = Math.abs(tp - entry)
  const rewardDollar = positionSize * tpDiff
  const rr = rewardDollar / riskDollar

  const positionValue = positionSize * entry

  return {
    riskDollar,
    rewardDollar,
    rr,
    positionValue,
    positionLabel: `${fmt(positionSize, 4)} coins ($${fmt(positionValue, 2)})`,
    extra: [{ label: 'SL distance', value: `$${fmt(slDiff, 2)}` }],
  }
}

function calcForex(f: Fields) {
  const account = parseNumber(f.account)
  const risk = parseNumber(f.risk)
  const entry = parseNumber(f.entry)
  const sl = parseNumber(f.sl)
  const tp = parseNumber(f.tp)
  const pipValue = parseNumber(f.pipValue)
  if (!account || !risk || !entry || !sl || !tp || !pipValue) return null

  const slPips = Math.abs(entry - sl) * 10000
  const tpPips = Math.abs(tp - entry) * 10000
  if (slPips === 0) return null
  const riskDollar = account * (risk / 100)
  const lotSize = riskDollar / (slPips * pipValue)
  const rewardDollar = lotSize * tpPips * pipValue
  const rr = rewardDollar / riskDollar

  return {
    riskDollar,
    rewardDollar,
    rr,
    positionValue: lotSize,
    positionLabel: `${fmt(lotSize, 2)} lots`,
    extra: [
      { label: 'SL', value: `${fmt(slPips, 1)} pips` },
      { label: 'TP', value: `${fmt(tpPips, 1)} pips` },
    ],
  }
}

function calcIndices(f: Fields) {
  const account = parseNumber(f.account)
  const risk = parseNumber(f.risk)
  const entry = parseNumber(f.entry)
  const sl = parseNumber(f.sl)
  const tp = parseNumber(f.tp)
  const pointValue = parseNumber(f.pointValue)
  if (!account || !risk || !entry || !sl || !tp || !pointValue) return null

  const slPoints = Math.abs(entry - sl)
  const tpPoints = Math.abs(tp - entry)
  if (slPoints === 0) return null
  const riskDollar = account * (risk / 100)
  const contracts = riskDollar / (slPoints * pointValue)
  const rewardDollar = contracts * tpPoints * pointValue
  const rr = rewardDollar / riskDollar

  return {
    riskDollar,
    rewardDollar,
    rr,
    positionValue: contracts,
    positionLabel: `${fmt(contracts, 2)} contracts`,
    extra: [
      { label: 'SL', value: `${fmt(slPoints, 1)} pts` },
      { label: 'TP', value: `${fmt(tpPoints, 1)} pts` },
    ],
  }
}

type Props = {
  content: BlockContent
  onUpdate: (content: BlockContent) => void
}

export default function RiskCalculatorBlock({ content, onUpdate }: Props) {
  const [mode, setMode] = useState<AssetMode>((content.rcMode as AssetMode) ?? 'crypto')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const imgInputRef = useRef<HTMLInputElement>(null)
  const [fields, setFields] = useState<Fields>({
    account: content.rcAccount ?? DEFAULTS.account,
    risk: content.rcRisk ?? DEFAULTS.risk,
    entry: content.rcEntry ?? DEFAULTS.entry,
    sl: content.rcSL ?? DEFAULTS.sl,
    tp: content.rcTP ?? DEFAULTS.tp,
    pipValue: content.rcPipValue ?? DEFAULTS.pipValue,
    pointValue: content.rcPointValue ?? DEFAULTS.pointValue,
  })

  useEffect(() => {
    setMode((content.rcMode as AssetMode) ?? 'crypto')
    setFields({
      account: content.rcAccount ?? DEFAULTS.account,
      risk: content.rcRisk ?? DEFAULTS.risk,
      entry: content.rcEntry ?? DEFAULTS.entry,
      sl: content.rcSL ?? DEFAULTS.sl,
      tp: content.rcTP ?? DEFAULTS.tp,
      pipValue: content.rcPipValue ?? DEFAULTS.pipValue,
      pointValue: content.rcPointValue ?? DEFAULTS.pointValue,
    })
  }, [content.rcMode, content.rcAccount, content.rcRisk, content.rcEntry, content.rcSL, content.rcTP, content.rcPipValue, content.rcPointValue])

  const setField = (key: keyof Fields, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  const saveField = (key: keyof Fields, value: string) => {
    onUpdate({ ...content, [`rc${key.charAt(0).toUpperCase() + key.slice(1)}`]: value })
  }

  const handleModeChange = (newMode: AssetMode) => {
    setMode(newMode)
    onUpdate({ ...content, rcMode: newMode })
  }

  const analyzeImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return

      setAnalyzing(true)
      setAnalyzeError('')

      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string

        try {
          const res = await fetch('/api/ai/extract-trade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64, preferredMode: mode }),
          })

          const data = (await res.json()) as ExtractionResponse

          if (data.error) {
            setAnalyzeError(typeof data.error === 'string' && data.error.length < 120 ? data.error : 'Could not read values from image')
            return
          }

          if (
            data.account == null &&
            data.risk == null &&
            data.entry == null &&
            data.sl == null &&
            data.tp == null &&
            data.pipValue == null &&
            data.pointValue == null
          ) {
            setAnalyzeError('AI did not find values on the image')
            return
          }

          const newMode: AssetMode = data.mode ?? mode
          const newFields: Fields = {
            ...fields,
            account: data.account != null ? toFieldValue(data.account) : fields.account,
            risk: data.risk != null ? toFieldValue(data.risk) : fields.risk,
            entry: data.entry != null ? toFieldValue(data.entry) : fields.entry,
            sl: data.sl != null ? toFieldValue(data.sl) : fields.sl,
            tp: data.tp != null ? toFieldValue(data.tp) : fields.tp,
            pipValue: data.pipValue != null ? toFieldValue(data.pipValue) : fields.pipValue,
            pointValue: data.pointValue != null ? toFieldValue(data.pointValue) : fields.pointValue,
          }

          setFields(newFields)
          setMode(newMode)

          onUpdate({
            ...content,
            rcMode: newMode,
            rcAccount: newFields.account,
            rcRisk: newFields.risk,
            rcEntry: newFields.entry,
            rcSL: newFields.sl,
            rcTP: newFields.tp,
            rcPipValue: newFields.pipValue,
            rcPointValue: newFields.pointValue,
          })
        } catch (err) {
          setAnalyzeError(err instanceof Error ? err.message.slice(0, 120) : 'Image analysis failed')
        } finally {
          setAnalyzing(false)
        }
      }

      reader.readAsDataURL(file)
    },
    [fields, mode, content, onUpdate]
  )

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const imageItem = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (!imageItem) return
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (file) analyzeImage(file)
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [analyzeImage])

  const result = mode === 'crypto' ? calcCrypto(fields) : mode === 'forex' ? calcForex(fields) : calcIndices(fields)

  const rrColor =
    !result ? 'text-zinc-500' : result.rr >= 2 ? 'text-emerald-400' : result.rr >= 1 ? 'text-yellow-400' : 'text-red-400'

  const input = (label: string, key: keyof Fields, placeholder: string, accent?: 'red' | 'green') => (
    <label className="flex flex-col gap-1">
      <span
        className={`text-[10px] uppercase tracking-wider ${
          accent === 'red' ? 'text-red-400/70' : accent === 'green' ? 'text-emerald-400/70' : 'text-zinc-500'
        }`}
      >
        {label}
      </span>
      <input
        type="number"
        value={fields[key]}
        onChange={e => setField(key, e.target.value)}
        onBlur={() => saveField(key, fields[key])}
        placeholder={placeholder}
        className={`rounded-lg border bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
          accent === 'red'
            ? 'border-red-900/50 focus:border-red-700/60'
            : accent === 'green'
              ? 'border-emerald-900/50 focus:border-emerald-700/60'
              : 'border-zinc-700 focus:border-zinc-500'
        }`}
      />
    </label>
  )

  return (
    <div className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-900 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Risk Calculator</span>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 p-0.5">
          {MODES.map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => handleModeChange(m.value)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                mode === m.value ? 'bg-zinc-600 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div
        onDragOver={e => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files[0]
          if (f) analyzeImage(f)
        }}
        onClick={() => imgInputRef.current?.click()}
        className={`flex cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-2.5 transition-colors ${
          dragOver ? 'border-zinc-400 bg-zinc-800' : 'border-zinc-700 hover:border-zinc-500'
        }`}
      >
        <input
          ref={imgInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) analyzeImage(f)
          }}
        />
        {analyzing ? (
          <span className="text-xs text-zinc-400">Analyzing image...</span>
        ) : (
          <>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-zinc-500"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-xs text-zinc-500">Paste or drop screenshot and AI fills Account, Risk, Entry, SL, TP (plus mode fields)</span>
            {analyzeError && <span className="text-xs text-red-400">{analyzeError}</span>}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {input('Account ($)', 'account', '1000')}
        {input('Risk (%)', 'risk', '1')}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {input('Entry', 'entry', '0.00')}
        {input('Stop Loss', 'sl', '0.00', 'red')}
        {input('Take Profit', 'tp', '0.00', 'green')}
      </div>

      {mode === 'forex' && (
        <div className="grid grid-cols-2 gap-3">
          {input('Pip value ($ per std lot)', 'pipValue', '10')}
          <div className="flex flex-col justify-end pb-2">
            <span className="text-[10px] text-zinc-600">1 pip = 0.0001</span>
          </div>
        </div>
      )}

      {mode === 'indices' && (
        <div className="grid grid-cols-2 gap-3">
          {input('Value per point ($)', 'pointValue', '1')}
          <div className="flex flex-col justify-end pb-2">
            <span className="text-[10px] text-zinc-600">Typical value depends on index/contract</span>
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-800/50 px-4 py-3">
        <div className="flex items-center justify-between border-b border-zinc-700/50 pb-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Position size</span>
            <span className="font-mono text-lg font-bold text-white">{result?.positionLabel ?? '-'}</span>
          </div>
          {result?.extra && result.extra.length > 0 && (
            <div className="flex gap-4">
              {result.extra.map(e => (
                <div key={e.label} className="flex flex-col items-end gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500">{e.label}</span>
                  <span className="font-mono text-sm text-zinc-300">{e.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Risk ($)</span>
            <span className="font-mono text-sm text-red-400">{result ? `$${fmt(result.riskDollar)}` : '-'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Reward ($)</span>
            <span className="font-mono text-sm text-emerald-400">{result ? `$${fmt(result.rewardDollar)}` : '-'}</span>
          </div>
          <div className="ml-auto flex flex-col items-end gap-0.5">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">R:R Ratio</span>
            <span className={`font-mono text-2xl font-bold ${rrColor}`}>{result ? `1 : ${fmt(result.rr)}` : '-'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

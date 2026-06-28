'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects, getReport } from '@/lib/api'
import ScoreRing from '@/components/ScoreRing'
import StatusBadge from '@/components/StatusBadge'
import { FileText, ExternalLink, PlusCircle, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface Project {
  id: number
  business_name: string
  status: string
  target_location: string
  created_at: string
  overall_score?: number
}

// Fetch the real score from report_data since projects API may return 0
async function fetchRealScore(projectId: number): Promise<number | null> {
  try {
    const { data } = await getReport(projectId)
    return data?.report_data?.seo_scores?.overall_score ?? null
  } catch {
    return null
  }
}

function ScoreIndicator({ score }: { score: number }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#2563eb' : score >= 40 ? '#d97706' : '#dc2626'
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Poor'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
      <div style={{
        width: 68, height: 68, borderRadius: '50%',
        border: `4px solid ${color}`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#fff', flexDirection: 'column'
      }}>
        <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>/100</span>
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 600, marginTop: 4 }}>{label}</span>
    </div>
  )
}

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [scores, setScores] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjects()
      .then(async ({ data }) => {
        setProjects(data)
        const completed = data.filter((p: Project) => p.status === 'completed')
        // Fetch real scores from report_data for all completed projects
        const scoreResults = await Promise.all(
          completed.map(async (p: Project) => {
            const real = await fetchRealScore(p.id)
            return { id: p.id, score: real ?? p.overall_score ?? 0 }
          })
        )
        const scoreMap: Record<number, number> = {}
        scoreResults.forEach(({ id, score }) => { scoreMap[id] = score })
        setScores(scoreMap)
      })
      .finally(() => setLoading(false))
  }, [])

  const completed = projects.filter(p => p.status === 'completed')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">SEO Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {completed.length} completed {completed.length === 1 ? 'report' : 'reports'}
          </p>
        </div>
        <Link href="/analyze" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> New Analysis
        </Link>
      </div>

      {loading ? (
        <div className="card text-center py-12 text-slate-400">Loading reports…</div>
      ) : completed.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-600 mb-2">No completed reports yet</h3>
          <p className="text-slate-400 text-sm mb-6">Run an analysis to generate your first SEO report</p>
          <Link href="/analyze" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Start Analysis
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {completed.map(p => {
            const score = scores[p.id] ?? 0
            const scoreColor = score >= 80 ? '#16a34a' : score >= 60 ? '#2563eb' : score >= 40 ? '#d97706' : '#dc2626'
            return (
              <div key={p.id} style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                padding: '20px 24px', display: 'flex', alignItems: 'center',
                gap: 20, transition: 'box-shadow 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <ScoreIndicator score={score} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                      {p.business_name}
                    </h3>
                    <StatusBadge status={p.status} />
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 8px' }}>
                    📍 {p.target_location} · 📅 {new Date(p.created_at).toLocaleDateString()}
                  </p>
                  {/* Mini score bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, background: '#f1f5f9', borderRadius: 4, height: 6, maxWidth: 200 }}>
                      <div style={{
                        width: `${Math.min(100, score)}%`, height: 6,
                        borderRadius: 4, background: scoreColor, transition: 'width 0.6s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      SEO Score: <strong style={{ color: scoreColor }}>{score}/100</strong>
                    </span>
                  </div>
                </div>

                <Link
                  href={`/reports/${p.id}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: '#6366f1', color: '#fff', textDecoration: 'none',
                    whiteSpace: 'nowrap', flexShrink: 0
                  }}
                >
                  <ExternalLink style={{ width: 14, height: 14 }} /> View Report
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
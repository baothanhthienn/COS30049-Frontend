import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TrendPoint } from '../../types/api'
import './BlockRateSparkline.css'

interface Props {
  points: TrendPoint[]
}

interface SparkPoint {
  idx: number
  label: string
  blockRate: number
}

function buildSparkData(points: TrendPoint[]): SparkPoint[] {
  const window = 5
  return points.map((p, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1)
    const blocked = slice.filter((x) => x.verdict === 'BLOCKED').length
    return {
      idx: i,
      label: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      blockRate: Math.round((blocked / slice.length) * 100),
    }
  })
}

export default function BlockRateSparkline({ points }: Props) {
  if (points.length === 0) {
    return <div className="sparkline sparkline--empty">No data yet</div>
  }

  const data = buildSparkData(points)
  const latest = data[data.length - 1]?.blockRate ?? 0

  return (
    <div className="sparkline">
      <div className="sparkline__header">
        <span className="sparkline__label">Block rate (5-msg rolling)</span>
        <span className="sparkline__value" style={{ color: latest > 50 ? 'var(--color-blocked)' : 'var(--color-benign)' }}>
          {latest}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={60}>
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--color-blocked)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="var(--color-blocked)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" hide />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            contentStyle={{
              background: 'var(--color-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--color-text)',
            }}
            formatter={(v) => [`${v}%`, 'Block rate']}
          />
          <Area
            type="monotone"
            dataKey="blockRate"
            stroke="var(--color-blocked)"
            strokeWidth={1.5}
            fill="url(#sparkGrad)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

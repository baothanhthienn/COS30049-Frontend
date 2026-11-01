import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <p style={{ fontSize: 'var(--text-2xl)', color: 'var(--color-text-muted)' }}>404</p>
      <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-text-subtle)' }}>
        Page not found.
      </p>
      <Link
        to="/"
        style={{ display: 'inline-block', marginTop: 'var(--space-4)', color: 'var(--color-accent)' }}
      >
        Back to analyser
      </Link>
    </div>
  )
}

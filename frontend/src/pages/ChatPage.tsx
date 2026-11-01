export default function ChatPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
      <div style={{ width: '100%', maxWidth: 768 }}>
        {/* TODO Phase 3: ChatFeed + Composer */}
        <p style={{ padding: '2rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Submit a prompt to analyse it for injection attempts.
        </p>
      </div>
    </div>
  )
}

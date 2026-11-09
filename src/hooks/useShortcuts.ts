import { useEffect } from 'react'

interface ShortcutHandlers {
  focusComposer: () => void
  newAnalysis: () => void
  prevMessage: () => void
  nextMessage: () => void
}

export function useShortcuts({ focusComposer, newAnalysis, prevMessage, nextMessage }: ShortcutHandlers) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      const tag = (e.target as HTMLElement).tagName

      // ⌘K — focus composer (works from anywhere)
      if (meta && e.key === 'k') {
        e.preventDefault()
        focusComposer()
        return
      }

      // ⌘⇧O — new analysis (clear + focus)
      if (meta && e.shiftKey && e.key === 'o') {
        e.preventDefault()
        newAnalysis()
        return
      }

      // J / K — prev/next message (only when not typing)
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.key === 'j') { e.preventDefault(); nextMessage(); return }
      if (e.key === 'k') { e.preventDefault(); prevMessage(); return }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focusComposer, newAnalysis, prevMessage, nextMessage])
}

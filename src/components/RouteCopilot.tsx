import {
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { sendPlannerAgentMessage } from '../api/client'
import type { PlannerAgentResponse } from '../api/client'
import type { PlannerConfig } from '../domain/types'
import { Overlay, OverlayHeader } from '../ui/Overlay'
import {
  Button,
  IconButton,
  SegmentedControl,
  cx,
} from '../ui/primitives'
import { SendIcon, SparkleIcon } from '../ui/icons'

export type CopilotMode = 'dock' | 'panel' | 'bar'

interface RouteCopilotProps {
  config: PlannerConfig
  selectedRouteId?: string
  onApply: (response: PlannerAgentResponse) => void
  open: boolean
  mode: CopilotMode
  isMobile: boolean
  onOpen: () => void
  onClose: () => void
  onSetMode: (mode: CopilotMode) => void
}

interface CopilotMessage {
  role: 'user' | 'assistant'
  text: string
}

const SEED_MESSAGE: CopilotMessage = {
  role: 'assistant',
  text: "Hi — I'm your route copilot. I can trim days, fix range warnings, maximize unique stations, or add detours. Try a suggestion below.",
}

const SUGGESTIONS = [
  'Trim a day',
  'Avoid tolls',
  'Maximize unique stations',
  'Add Yellowstone detour',
  'Fix range warnings',
]

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

function GlowDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cx(
        'flex-none rounded-full bg-accent2 shadow-[0_0_8px_var(--accent-2)]',
        className,
      )}
    />
  )
}

function MessageBubble({ message }: { message: CopilotMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'max-w-[85%] px-3 py-2 text-[13px] leading-relaxed break-words',
          isUser
            ? 'rounded-[14px_14px_4px_14px] bg-accent text-on-accent'
            : 'rounded-[14px_14px_14px_4px] border border-edge bg-panel2 text-ink',
        )}
      >
        {message.text}
      </div>
    </div>
  )
}

function MessageList({
  messages,
  className,
}: {
  messages: CopilotMessage[]
  className?: string
}) {
  return (
    <div className={cx('flex flex-col gap-3', className)}>
      {messages.map((message, i) => (
        <MessageBubble key={i} message={message} />
      ))}
    </div>
  )
}

function SuggestionChips({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SUGGESTIONS.map((text) => (
        <button
          key={text}
          type="button"
          disabled={disabled}
          onClick={() => onPick(text)}
          className="rounded-full border border-edge bg-panel2 px-2.5 py-[5px] text-[11.5px] text-dim transition hover:text-ink disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {text}
        </button>
      ))}
    </div>
  )
}

function InputRow({
  value,
  onChange,
  onSubmit,
  sending,
  placeholder = 'Ask the copilot to reshape the route…',
  large,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  sending: boolean
  placeholder?: string
  large?: boolean
}) {
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }
  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-edge bg-panel2 py-1 pr-1 pl-3">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        aria-label="Message the route copilot"
        className={cx(
          'min-w-0 flex-1 border-none bg-transparent text-ink outline-none placeholder:text-faint',
          large ? 'text-[14px]' : 'text-[13px]',
        )}
      />
      <IconButton
        label="Send message"
        size={32}
        onClick={onSubmit}
        disabled={sending || !value.trim()}
        className="flex-none border-transparent bg-accent text-on-accent hover:brightness-95"
      >
        <SendIcon size={15} />
      </IconButton>
    </div>
  )
}

function CopilotHeader({
  mode,
  onSetMode,
  onClose,
}: {
  mode: CopilotMode
  onSetMode: (mode: CopilotMode) => void
  onClose: () => void
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-edge px-4 py-3.5">
      <GlowDot className="h-2 w-2" />
      <div className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">
        Route Copilot
      </div>
      <SegmentedControl<CopilotMode>
        tone="accent2"
        size="sm"
        ariaLabel="Copilot display mode"
        value={mode}
        onChange={onSetMode}
        options={[
          { value: 'panel', label: 'Panel' },
          { value: 'bar', label: 'Bar' },
          { value: 'dock', label: 'Dock' },
        ]}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close copilot"
        className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-panel2 text-dim transition hover:text-ink cursor-pointer"
      >
        <span aria-hidden className="text-[18px] leading-none">
          ×
        </span>
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* RouteCopilot                                                        */
/* ------------------------------------------------------------------ */

export function RouteCopilot({
  config,
  selectedRouteId,
  onApply,
  open,
  mode,
  isMobile,
  onOpen,
  onClose,
  onSetMode,
}: RouteCopilotProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([SEED_MESSAGE])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setSending(true)
    try {
      const response = await sendPlannerAgentMessage({
        message: trimmed,
        config,
        selectedRouteId,
      })
      setMessages((prev) => [...prev, { role: 'assistant', text: response.message }])
      onApply(response)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      setMessages((prev) => [...prev, { role: 'assistant', text: message }])
    } finally {
      setInput('')
      setSending(false)
    }
  }

  const handleSubmit = () => {
    void send(input)
  }

  const handleSuggestion = (text: string) => {
    void send(text)
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')

  /* ---------- Launcher pill ---------- */
  const showLauncher = !open || (open && mode === 'bar' && !isMobile)
  const launcher = showLauncher ? (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open Route Copilot"
      className={cx(
        'fixed left-[18px] z-[900] inline-flex h-11 items-center gap-2.5 rounded-full border border-edge2 bg-panel py-0 pr-[18px] pl-4 text-[13.5px] font-semibold text-ink shadow-card transition hover:brightness-95 cursor-pointer',
        isMobile
          ? 'bottom-[max(76px,calc(env(safe-area-inset-bottom)+76px))]'
          : 'bottom-[max(18px,env(safe-area-inset-bottom))]',
      )}
    >
      <span
        aria-hidden
        className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent2 text-on-accent2 shadow-[0_0_12px_var(--accent-2)]"
      >
        <SparkleIcon size={13} />
      </span>
      Route Copilot
    </button>
  ) : null

  /* ---------- Mobile sheet (mode is ignored on mobile) ---------- */
  if (isMobile && open) {
    return (
      <Overlay open onClose={onClose} size="detail" labelledBy="copilot-sheet-title">
        <OverlayHeader
          titleId="copilot-sheet-title"
          badge={
            <span className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-[11px] border border-edge bg-panel2 text-accent2">
              <SparkleIcon size={15} />
            </span>
          }
          kicker="Assistant"
          title="Route Copilot"
          onClose={onClose}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
          <MessageList messages={messages} />
        </div>
        <div className="flex flex-col gap-2.5 border-t border-edge px-5 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
          <SuggestionChips onPick={handleSuggestion} disabled={sending} />
          <InputRow
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            sending={sending}
          />
        </div>
      </Overlay>
    )
  }

  /* ---------- Desktop dock (in-flow) ---------- */
  if (open && mode === 'dock' && !isMobile) {
    return (
      <div className="anim-slidein flex min-h-0 w-[340px] flex-none flex-col border-r border-edge bg-panel">
        <CopilotHeader mode={mode} onSetMode={onSetMode} onClose={onClose} />
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <MessageList messages={messages} />
        </div>
        <div className="flex flex-col gap-2.5 border-t border-edge px-3.5 py-3">
          <SuggestionChips onPick={handleSuggestion} disabled={sending} />
          <InputRow
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            sending={sending}
          />
        </div>
      </div>
    )
  }

  /* ---------- Desktop floating modes + launcher ---------- */
  let floating: ReactNode = null

  if (open && mode === 'panel' && !isMobile) {
    floating = (
      <div className="anim-pop fixed bottom-[max(18px,env(safe-area-inset-bottom))] left-[18px] z-[901] flex max-h-[560px] w-[360px] flex-col overflow-hidden rounded-2xl border border-edge2 bg-panel shadow-card">
        <CopilotHeader mode={mode} onSetMode={onSetMode} onClose={onClose} />
        <div className="min-h-[180px] flex-1 overflow-y-auto p-[15px]">
          <MessageList messages={messages} />
        </div>
        <div className="flex flex-col gap-2.5 border-t border-edge px-3.5 py-3">
          <SuggestionChips onPick={handleSuggestion} disabled={sending} />
          <InputRow
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            sending={sending}
          />
        </div>
      </div>
    )
  }

  if (open && mode === 'bar' && !isMobile) {
    floating = (
      <div
        className="anim-pop fixed top-[18px] left-1/2 z-[901] -translate-x-1/2"
        style={{ width: 'min(620px, calc(100% - 120px))' }}
      >
        <div className="overflow-hidden rounded-[13px] border border-edge2 bg-panel shadow-card">
          <BarInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            sending={sending}
            mode={mode}
            onSetMode={onSetMode}
            onClose={onClose}
          />
          <div className="flex flex-wrap gap-1.5 px-3.5 pb-3">
            <SuggestionChips onPick={handleSuggestion} disabled={sending} />
          </div>
          {lastAssistant ? (
            <div className="border-t border-edge bg-panel2 px-4 py-3 text-[13px] leading-relaxed text-ink">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent2">
                Copilot
              </span>
              <div className="mt-1.5 line-clamp-2">{lastAssistant.text}</div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <>
      {launcher}
      {floating}
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Command-bar input row (bar mode)                                    */
/* ------------------------------------------------------------------ */

function BarInput({
  value,
  onChange,
  onSubmit,
  sending,
  mode,
  onSetMode,
  onClose,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  sending: boolean
  mode: CopilotMode
  onSetMode: (mode: CopilotMode) => void
  onClose: () => void
}) {
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }
  const handleForm = (e: FormEvent) => {
    e.preventDefault()
    onSubmit()
  }
  return (
    <form onSubmit={handleForm} className="flex items-center gap-2.5 px-3.5 py-3">
      <GlowDot className="h-2 w-2" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask the copilot to reshape the route…"
        aria-label="Command the route copilot"
        className="min-w-0 flex-1 border-none bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
      />
      <SegmentedControl<CopilotMode>
        tone="accent2"
        size="sm"
        ariaLabel="Copilot display mode"
        value={mode}
        onChange={onSetMode}
        options={[
          { value: 'panel', label: 'Panel' },
          { value: 'dock', label: 'Dock' },
        ]}
      />
      <Button
        type="submit"
        variant="primary"
        size="sm"
        aria-label="Send message"
        disabled={sending || !value.trim()}
        className="flex-none"
      >
        <SendIcon size={14} />
      </Button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close copilot"
        className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-panel2 text-dim transition hover:text-ink cursor-pointer"
      >
        <span aria-hidden className="text-[18px] leading-none">
          ×
        </span>
      </button>
    </form>
  )
}

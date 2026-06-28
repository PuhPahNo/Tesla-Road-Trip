import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { sendPlannerAgentMessage, type PlannerAgentResponse } from '../api/client'
import type { PlannerConfig } from '../domain/types'
import { IconButton, cx } from '../ui/primitives'
import { SendIcon, SparkleIcon } from '../ui/icons'

interface RouteCopilotPanelProps {
  config: PlannerConfig
  selectedRouteId?: string
  onApply: (response: PlannerAgentResponse) => void
  showHeader?: boolean
  className?: string
}

interface CopilotMessage {
  role: 'user' | 'assistant'
  text: string
  actions?: string[]
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

function MessageBubble({ message }: { message: CopilotMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'max-w-[85%] break-words px-3 py-2 text-[13px] leading-relaxed',
          isUser
            ? 'rounded-[14px_14px_4px_14px] bg-accent text-on-accent'
            : 'rounded-[14px_14px_14px_4px] border border-edge bg-panel2 text-ink',
        )}
      >
        {message.text}
        {!isUser && message.actions && message.actions.length > 0 ? (
          <div className="mt-2 border-t border-edge pt-2 font-mono text-[10.5px] leading-snug text-faint">
            {message.actions.map((action, index) => (
              <div key={`${action}-${index}`}>{action}</div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function MessageList({
  messages,
  sending,
}: {
  messages: CopilotMessage[]
  sending: boolean
}) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, sending])

  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {messages.map((message, i) => (
        <MessageBubble key={i} message={message} />
      ))}
      {sending ? (
        <div className="flex justify-start">
          <div className="rounded-[14px_14px_14px_4px] border border-edge bg-panel2 px-3 py-2 text-[13px] leading-relaxed text-ink">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent2" />
              Working with the route planner...
            </span>
          </div>
        </div>
      ) : null}
      <div ref={endRef} />
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
          className="cursor-pointer rounded-full border border-edge bg-panel2 px-2.5 py-[5px] text-[11.5px] text-dim transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
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
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  sending: boolean
}) {
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-[10px] border border-edge bg-panel2 py-1 pl-3 pr-1">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask the copilot to reshape the route..."
        aria-label="Message the route copilot"
        className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
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

export function RouteCopilotPanel({
  config,
  selectedRouteId,
  onApply,
  showHeader = true,
  className,
}: RouteCopilotPanelProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([SEED_MESSAGE])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }])
    setInput('')
    setSending(true)
    try {
      const response = await sendPlannerAgentMessage({
        message: trimmed,
        config,
        selectedRouteId,
      })
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: response.message,
          actions: response.actions,
        },
      ])
      onApply(response)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      setMessages((prev) => [...prev, { role: 'assistant', text: message }])
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = () => {
    void send(input)
  }

  const handleSuggestion = (text: string) => {
    void send(text)
  }

  return (
    <section className={cx('flex min-h-0 flex-1 flex-col bg-panel', className)}>
      {showHeader ? (
        <div className="flex flex-none items-center gap-2.5 border-b border-edge px-4 py-3.5">
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] border border-edge bg-panel2 text-accent2">
            <SparkleIcon size={14} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[14px] font-semibold text-ink">Route Copilot</div>
            <div className="mt-px truncate font-mono text-[10.5px] text-faint">
              Ask for route edits, constraints, and tradeoffs
            </div>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <MessageList messages={messages} sending={sending} />
      </div>

      <div className="flex flex-none flex-col gap-2.5 border-t border-edge px-3.5 py-3">
        <SuggestionChips onPick={handleSuggestion} disabled={sending} />
        <InputRow
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          sending={sending}
        />
      </div>
    </section>
  )
}

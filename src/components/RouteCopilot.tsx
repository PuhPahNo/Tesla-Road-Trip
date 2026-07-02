import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { sendPlannerAgentMessage, type PlannerAgentResponse } from '../api/client'
import type { PlannerConfig } from '../domain/types'
import { cx } from '../ui/primitives'
import { CloseIcon, SendIcon, SparkleIcon } from '../ui/icons'

interface RouteCopilotPanelProps {
  config: PlannerConfig
  selectedRouteId?: string
  onApply: (response: PlannerAgentResponse) => void
  /** 'floating' renders the desktop glass panel; 'sheet' renders bare content for a mobile sheet. */
  mode?: 'floating' | 'sheet'
  onClose?: () => void
}

interface CopilotMessage {
  role: 'user' | 'assistant'
  text: string
  actions?: string[]
}

const SEED_MESSAGE: CopilotMessage = {
  role: 'assistant',
  text: "Hi — I'm your route copilot. I can trim days, maximize unique sites, fix range warnings, or add a detour. Try a chip below.",
}

const SUGGESTIONS = [
  'Trim a day',
  'Maximize unique stations',
  'Fix range warnings',
  'Add Yellowstone detour',
  'Avoid tolls',
]

function MessageBubble({ message }: { message: CopilotMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cx(
          'max-w-[86%] break-words px-3 py-[9px] text-[13px] leading-[1.5]',
          isUser
            ? 'rounded-[14px_14px_4px_14px] bg-accent text-on-accent'
            : 'rounded-[14px_14px_14px_4px] border border-edge bg-panel2 text-ink',
        )}
      >
        <span>{message.text}</span>
        {!isUser && message.actions && message.actions.length > 0 ? (
          <div className="mt-2 border-t border-edge pt-2 font-mono text-[10px] leading-[1.6] text-faint">
            {message.actions.map((action, index) => (
              <div key={`${action}-${index}`}>› {action}</div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function RouteCopilotPanel({
  config,
  selectedRouteId,
  onApply,
  mode = 'floating',
  onClose,
}: RouteCopilotPanelProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([SEED_MESSAGE])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, sending])

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
        { role: 'assistant', text: response.message, actions: response.actions },
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

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void send(input)
    }
  }

  const body = (
    <>
      <div className="flex flex-none items-center gap-2.5 border-b border-edge px-3.5 py-[13px]">
        <span className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] border border-edge bg-chip text-accent2">
          <SparkleIcon size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold text-ink">Route Copilot</div>
          <div className="truncate font-mono text-[9.5px] text-faint">
            Reshape the plan in plain language
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close copilot"
            className="flex h-7 w-7 flex-none cursor-pointer items-center justify-center rounded-lg border border-edge bg-transparent text-dim transition hover:text-ink"
          >
            <CloseIcon size={13} />
          </button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3.5" aria-live="polite">
        {messages.map((message, i) => (
          <MessageBubble key={i} message={message} />
        ))}
        {sending ? (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-[13px_13px_13px_4px] border border-edge bg-panel2 px-3 py-[9px] text-[12.5px] text-dim">
              <span className="anim-pulse h-[7px] w-[7px] rounded-full bg-accent2" />
              Working with the planner…
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="flex flex-none flex-col gap-[9px] border-t border-edge px-3 py-[11px]">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((text) => (
            <button
              key={text}
              type="button"
              disabled={sending}
              onClick={() => void send(text)}
              className="cursor-pointer rounded-full border border-edge bg-chip px-2.5 py-[5px] text-[11px] text-dim transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {text}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-[11px] border border-edge bg-panel2 py-[5px] pl-3 pr-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask the copilot to reshape the route…"
            aria-label="Message the route copilot"
            className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
          />
          <button
            type="button"
            onClick={() => void send(input)}
            disabled={sending || !input.trim()}
            aria-label="Send message"
            className="flex h-[34px] w-[34px] flex-none cursor-pointer items-center justify-center rounded-[9px] border-none bg-accent text-on-accent transition hover:brightness-95 disabled:opacity-60"
          >
            <SendIcon size={15} />
          </button>
        </div>
      </div>
    </>
  )

  if (mode === 'sheet') {
    return <section className="flex min-h-0 flex-1 flex-col">{body}</section>
  }

  return (
    <section className="glass anim-pop fixed right-4 top-[76px] z-[70] flex h-[min(560px,72vh)] w-[380px] flex-col overflow-hidden rounded-[15px]">
      {body}
    </section>
  )
}

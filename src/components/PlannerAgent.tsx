import { useState } from 'react'
import { Bot, Send, ShieldCheck } from 'lucide-react'
import {
  sendPlannerAgentMessage,
  type PlannerAgentResponse,
} from '../api/client'
import type { PlannerConfig } from '../domain/types'

interface PlannerAgentProps {
  config: PlannerConfig
  selectedRouteId?: string
  onApply: (response: PlannerAgentResponse) => void
}

interface AgentMessage {
  role: 'user' | 'assistant' | 'system'
  text: string
}

export function PlannerAgent({
  config,
  selectedRouteId,
  onApply,
}: PlannerAgentProps) {
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      role: 'system',
      text: 'Ask the trip agent to inspect routes, change planner settings, add required waypoints, and reoptimize.',
    },
  ])

  const sendMessage = async () => {
    const message = input.trim()
    if (!message || isSending) return

    setInput('')
    setIsSending(true)
    setMessages((current) => [...current, { role: 'user', text: message }])

    try {
      const response = await sendPlannerAgentMessage({
        message,
        config,
        selectedRouteId,
      })
      onApply(response)
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: response.message,
        },
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            error instanceof Error
              ? error.message
              : 'The trip agent request failed.',
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="agent-panel" aria-label="Trip agent">
      <header className="compact-panel-heading">
        <div>
          <p className="eyebrow">OpenAI trip agent</p>
          <h2>Route assistant</h2>
        </div>
        <ShieldCheck size={18} />
      </header>

      <div className="agent-messages">
        {messages.slice(-4).map((message, index) => (
          <p key={`${message.role}-${index}`} className={`agent-message ${message.role}`}>
            {message.role === 'assistant' && <Bot size={14} />}
            <span>{message.text}</span>
          </p>
        ))}
      </div>

      <form
        className="agent-form"
        onSubmit={(event) => {
          event.preventDefault()
          void sendMessage()
        }}
      >
        <input
          aria-label="Trip agent request"
          placeholder="Example: make this route stop near the Grand Canyon"
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button
          aria-label="Send trip agent request"
          className="icon-button"
          type="submit"
          disabled={isSending || input.trim().length === 0}
        >
          <Send size={17} />
        </button>
      </form>
    </section>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { SmilePlus } from "lucide-react"

const REACTIONS = [
  { type: 'like', emoji: '👍', label: '좋아요' },
  { type: 'haha', emoji: '😂', label: '웃겨요' },
  { type: 'agree', emoji: '👌', label: '동의해요' },
  { type: 'thanks', emoji: '🙏', label: '감사해요' },
  { type: 'wow', emoji: '😮', label: '놀라워요' },
] as const

interface PhotoReactionsProps {
  photoId: number
  isLoggedIn: boolean
}

export function PhotoReactions({ photoId, isLoggedIn }: PhotoReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, number>>({})
  const [userReactions, setUserReactions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const fetchReactions = useCallback(async () => {
    try {
      const response = await fetch(`/api/photo-gallery/${photoId}/reaction`)
      const data = await response.json()
      if (data.success) {
        setReactions(data.reactions || {})
        setUserReactions(data.userReactions || [])
      }
    } catch (error) {
      console.error('리액션 조회 에러:', error)
    }
  }, [photoId])

  useEffect(() => {
    fetchReactions()
  }, [fetchReactions])

  const handleReaction = async (type: string) => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      const response = await fetch(`/api/photo-gallery/${photoId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      const data = await response.json()

      if (response.ok) {
        setReactions(data.reactions || {})
        setUserReactions(data.userReactions || [])
      }
    } catch (error) {
      console.error('리액션 에러:', error)
    }

    setIsOpen(false)
  }

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0)
  const activeReactions = REACTIONS.filter(r => reactions[r.type] > 0)

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {activeReactions.map(({ type, emoji }) => {
        const count = reactions[type] || 0
        const isActive = userReactions.includes(type)

        return (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors",
              isActive
                ? "bg-primary/20 text-primary"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <span>{emoji}</span>
            <span>{count}</span>
          </button>
        )
      })}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
              totalReactions === 0 && "ml-0"
            )}
          >
            <SmilePlus className="h-4 w-4" />
            {totalReactions === 0 && <span>반응</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="flex gap-1">
            {REACTIONS.map(({ type, emoji, label }) => {
              const isActive = userReactions.includes(type)
              return (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  title={label}
                  className={cn(
                    "p-2 rounded-lg text-xl hover:bg-muted transition-colors",
                    isActive && "bg-primary/20"
                  )}
                >
                  {emoji}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

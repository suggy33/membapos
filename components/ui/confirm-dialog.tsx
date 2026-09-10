"use client"

import { useEffect, useId, useRef } from "react"

import { cn } from "@/lib/utils"

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false, onCancel, onConfirm }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel() }
    document.addEventListener("keydown", onKeyDown)
    cancelRef.current?.focus()
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onCancel, open])

  if (!open) return null
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}><div role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl"><h2 id={titleId} className="text-lg font-semibold">{title}</h2><p id={descriptionId} className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button ref={cancelRef} type="button" onClick={onCancel} className="min-h-11 rounded-md border px-4 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{cancelLabel}</button><button type="button" onClick={onConfirm} className={cn("min-h-11 rounded-md px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", danger ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90")}>{confirmLabel}</button></div></div></div>
}

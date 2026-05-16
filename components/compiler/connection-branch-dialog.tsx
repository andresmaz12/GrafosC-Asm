'use client'

// ============================================
// COMPILADOR - Connection Branch Dialog
// ============================================
// Dialogo modal que pide al usuario elegir la rama (yes / no / case1..3)
// al crear una conexion saliente desde un nodo decision.

import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { branchLabelDefault } from '@/lib/compiler/connection-utils'
import type {
  ConditionalType,
  FlowchartConnection,
} from '@/lib/compiler/types'

type BranchType = Exclude<FlowchartConnection['type'], 'default'>

interface ConnectionBranchDialogProps {
  open: boolean
  conditionalType: ConditionalType
  usedBranches: Set<FlowchartConnection['type']>
  onConfirm: (branch: BranchType, label: string) => void
  onCancel: () => void
}

const ALL_BRANCHES: BranchType[] = ['yes', 'no', 'case1', 'case2', 'case3']

const BRANCH_LABELS: Record<BranchType, string> = {
  yes: 'Si (verdadero)',
  no: 'No (falso)',
  case1: 'Caso 1',
  case2: 'Caso 2',
  case3: 'Caso 3',
}

export function ConnectionBranchDialog({
  open,
  conditionalType,
  usedBranches,
  onConfirm,
  onCancel,
}: ConnectionBranchDialogProps) {
  const availableBranches = useMemo<BranchType[]>(() => {
    const all = conditionalType === 'while'
      ? (['yes', 'no'] as BranchType[])
      : ALL_BRANCHES
    return all.filter((b) => !usedBranches.has(b))
  }, [conditionalType, usedBranches])

  const [branch, setBranch] = useState<BranchType | ''>('')
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (open) {
      const initial = availableBranches[0] ?? ''
      setBranch(initial)
      setLabel(initial ? branchLabelDefault(initial) : '')
    }
  }, [open, availableBranches])

  const canConfirm = Boolean(branch)

  const handleConfirm = () => {
    if (!branch) return
    onConfirm(branch, label.trim())
  }

  const handleBranchChange = (value: BranchType) => {
    setBranch(value)
    setLabel(branchLabelDefault(value))
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Tipo de rama</DialogTitle>
          <DialogDescription>
            La conexion sale de un nodo de decision. Elige a que rama corresponde.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {availableBranches.length === 0 ? (
            <p className="text-sm text-destructive">
              Este nodo de decision ya tiene todas sus ramas conectadas.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-sm">Rama</Label>
                <Select
                  value={branch}
                  onValueChange={(v) => handleBranchChange(v as BranchType)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar rama" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBranches.map((b) => (
                      <SelectItem key={b} value={b}>
                        {BRANCH_LABELS[b]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Etiqueta (opcional)</Label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Texto a mostrar sobre la flecha"
                  className="h-9"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            Conectar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

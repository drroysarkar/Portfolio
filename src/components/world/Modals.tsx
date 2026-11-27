'use client'

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Attendance } from '@/components/Attendance'
import { StackGraph } from '@/components/StackGraph'
import { useUI } from '@/lib/store'

/* In-app tools: the CRNN Cell Lab and the stack network graph. */
export function LabModal() {
  const lab = useUI(s => s.lab)
  const setLab = useUI(s => s.setLab)
  return (
    <Dialog open={lab} onOpenChange={v => { if (!v) setLab(false) }}>
      <DialogContent className="dlg-in dlg-tool" aria-describedby={undefined}>
        <DialogTitle asChild><h3>AttendanceMaster — Cell Lab</h3></DialogTitle>
        <DialogDescription asChild><p>The preprocessing pipeline that feeds the CRNN, running live in this page.</p></DialogDescription>
        <div className="tool-host"><Attendance /></div>
      </DialogContent>
    </Dialog>
  )
}

export function GraphModal() {
  const graph = useUI(s => s.graph)
  const setGraph = useUI(s => s.setGraph)
  return (
    <Dialog open={graph} onOpenChange={v => { if (!v) setGraph(false) }}>
      <DialogContent className="dlg-in dlg-tool" aria-describedby={undefined}>
        <DialogTitle asChild><h3>Stack — projects × technologies</h3></DialogTitle>
        <DialogDescription asChild><p>Every technology wired to the projects that use it. Drag nodes, click to focus.</p></DialogDescription>
        <div className="tool-host"><StackGraph /></div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useUI, go } from '@/lib/store'

export function Footer() {
  const setMuseum = useUI(s => s.setMuseum)
  const enterWorld = useUI(s => s.enterWorld)
  return (
    <footer>
      <div className="wrap foot-in">
        <div>
          <p className="big">Thanks for visiting.</p>
          <p style={{ marginTop: 14, maxWidth: '58ch' }}>
            One page, built from my CV and my own project code. Anything marked &ldquo;being confirmed&rdquo; is not yet verified.
            © {new Date().getFullYear()} Divyanshu Kumar.
          </p>
        </div>
        <div className="chips" style={{ marginTop: 0 }}>
          <button className="chip" type="button" onClick={() => go('top')}>↑ Back to top</button>
          <button className="chip" type="button" onClick={() => enterWorld(true)}>Drive the Atlas</button>
          <button className="chip" type="button" onClick={() => setMuseum(true)}>Walk the Museum</button>
        </div>
      </div>
    </footer>
  )
}

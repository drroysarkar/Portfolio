'use client'

import { EMAIL, PHONE } from '@/lib/data'
import { useUI } from '@/lib/store'
import { SectionHead, useReveal } from '@/components/Reveal'

export function Contact() {
  const toast = useUI(s => s.showToast)
  const rv1 = useReveal<HTMLDivElement>()
  const rv2 = useReveal<HTMLDivElement>()
  const rv0 = useReveal<HTMLDivElement>()

  const copy = async (txt: string, label: string) => {
    try { await navigator.clipboard.writeText(txt); toast(label + ' copied') }
    catch { toast('Press Ctrl+C to copy: ' + txt) }
  }

  return (
    <section className="sec" id="contact" aria-labelledby="c-h">
      <div className="wrap">
        <div className="contact-hero rv" ref={rv0}>
          <p className="eyebrow mono">About and contact</p>
          <h2 id="c-h" style={{ marginTop: 18 }}>Let&apos;s build something that <em>reads</em> the real world.</h2>
          <p className="lede">
            I am a software developer with practical full-stack experience across web, enterprise, university, desktop and mobile
            applications, now also working on computer vision. If you are hiring, or building something where messy real-world
            documents matter, write to me.
          </p>
          <div className="cta">
            <button className="btn pri" type="button" onClick={() => copy(EMAIL, 'Email')}>Copy email <span className="arr">↗</span></button>
            <button className="btn" type="button" onClick={() => copy(PHONE, 'Phone')}>Copy phone</button>
          </div>
        </div>
        <div className="contact-grid">
          <div ref={rv1} className="rv">
            <div className="copy"><span className="mono k">Email</span><span className="v" id="mail">{EMAIL}</span><button className="ibtn" type="button" onClick={() => copy(EMAIL, 'Email')}>Copy</button></div>
            <div className="copy"><span className="mono k">Phone</span><span className="v" id="tel">{PHONE}</span><button className="ibtn" type="button" onClick={() => copy(PHONE, 'Phone')}>Copy</button></div>
            <div className="copy"><span className="mono k">Based</span><span className="v">Lucknow, India</span></div>
            <p className="muted" style={{ marginTop: 20, fontSize: '.92rem' }}>Links to email and phone may not open from every viewer, so both are here to copy.</p>
          </div>
          <div className="tw rv" ref={rv2}>
            <table className="edu">
              <thead><tr><th>Education</th><th>Where</th><th>Result</th></tr></thead>
              <tbody>
                <tr>
                  <td>B.Tech</td>
                  <td>Bengal College of Engineering and Technology, Durgapur<br /><span className="muted" style={{ fontSize: '.85rem' }}>Discipline, dates and completion status are being verified.</span></td>
                  <td>CGPA 8.0</td>
                </tr>
                <tr><td>Intermediate (PCM)<br /><span className="muted" style={{ fontSize: '.85rem' }}>Mar 2019 – May 2021</span></td><td>Chauhan Public School, Bhagalpur</td><td>80%</td></tr>
                <tr><td>Matriculation<br /><span className="muted" style={{ fontSize: '.85rem' }}>Mar 2018 – May 2019</span></td><td>DAV Public School, Bhagalpur</td><td>85%</td></tr>
              </tbody>
            </table>
            <p style={{ marginTop: 18 }}><span className="mono muted">Certification</span><br />Software Developer Trainee, ARDENT, September 2024</p>
            <p style={{ marginTop: 12 }}><span className="mono muted">Core skills</span><br />Data Structures and Algorithms</p>
          </div>
        </div>
      </div>
    </section>
  )
}

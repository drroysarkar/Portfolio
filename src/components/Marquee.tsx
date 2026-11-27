'use client'

const ITEMS = [
  'Full Stack Developer', 'ASP.NET', 'SQL Server', 'React', 'C#', 'Computer Vision',
  'CRNN · PyTorch', 'Python · OpenCV', '20 Projects', 'University ERP', 'Lucknow', 'Open to work',
]

export function Marquee() {
  const row = (key: string) => (
    <div key={key} aria-hidden={key === 'b'}>
      {ITEMS.map((t, i) => (
        <span key={i}>{t} <i>✦</i></span>
      ))}
    </div>
  )
  return (
    <div className="mq" role="presentation">
      <div className="mq-in">
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}

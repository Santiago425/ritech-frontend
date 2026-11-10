export default function Marca({ claro = false }) {
  return (
    <div className={`marca ${claro ? 'marca--claro' : ''}`}>
      <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="#c8893b" />
        <path d="M32 12c-9 6-13 14-13 21s5 15 13 19c8-4 13-12 13-19s-4-15-13-21z" fill="#0f2a3d" />
        <path d="M32 16v34" stroke="#c8893b" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div>
        <strong>RiTech</strong>
        <span>Exports</span>
      </div>
    </div>
  )
}

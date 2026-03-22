export function Card({ className = '', children, ...props }) {
  return <div className={`glass-card ${className}`} {...props}>{children}</div>
}

export function Button({ variant = 'solid', className = '', children, ...props }) {
  const base = variant === 'outline' ? 'btn-outline' : 'btn'
  return <button className={`${base} ${className}`} {...props}>{children}</button>
}

export function Input(props) {
  return <input className="input" {...props} />
}

export function Textarea(props) {
  return <textarea className="input" {...props} />
}



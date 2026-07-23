export default function Input({ value, onChange, shake, ...props }) {
  return <input className={`answer-input ${shake ? 'shake' : ''}`} inputMode="numeric" pattern="[0-9]*" min="0" value={value} onChange={onChange} {...props} />;
}

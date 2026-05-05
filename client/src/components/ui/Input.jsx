export default function Input({
  label,
  error,
  placeholder,
  type = 'text',
  value,
  onChange,
  required = false,
  hint,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label className="text-[#a0a0a0] text-xs uppercase tracking-wider font-['Inter']">
          {label}
          {required && <span className="text-[#f87171] ml-0.5">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`
          w-full bg-[#1a1a1a] border rounded-lg px-4 py-3 text-white
          placeholder-[#555555] font-['Inter'] text-sm
          focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/10
          transition-all
          ${error ? 'border-[#f87171]' : 'border-[#2a2a2a]'}
        `}
        {...props}
      />
      {hint && !error && (
        <span className="text-[#555555] text-xs font-['Inter']">{hint}</span>
      )}
      {error && (
        <span className="text-[#f87171] text-xs font-['Inter']">{error}</span>
      )}
    </div>
  );
}

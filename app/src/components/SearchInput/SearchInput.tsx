import { FiSearch } from 'react-icons/fi'

type SearchInputProps = {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
}

export function SearchInput(props: SearchInputProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && props.onSearch) {
      props.onSearch(props.value || '')
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <FiSearch className="h-4 w-4 text-dark-brown" />
      </div>
      <input
        type="text"
        className="w-full rounded-lg border border-primary bg-white py-2.5 pl-10 pr-4 text-sm text-dark-brown placeholder:text-dark-brown/40 focus:border-dark-brown focus:shadow-[1px_1px_1px_1px_var(--dark-brown)] focus:outline-none"
        placeholder={props.placeholder || 'Search by name or email...'}
        value={props.value}
        onChange={(event) => props.onChange?.(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

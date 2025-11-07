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
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <FiSearch className="w-4 h-4 text-gray-400" />
      </div>
      <input
        type="text"
        className="w-full py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder={props.placeholder || 'Search by name or email...'}
        value={props.value}
        onChange={(event) => props.onChange?.(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

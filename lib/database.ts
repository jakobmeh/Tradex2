export type PropertyType =
  | 'title'
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'rating'
  | 'image'

export const PROPERTY_TYPES: { type: PropertyType; label: string; icon: string }[] = [
  { type: 'title',        label: 'Title',        icon: 'T'  },
  { type: 'text',         label: 'Text',         icon: '¶'  },
  { type: 'number',       label: 'Number',       icon: '#'  },
  { type: 'select',       label: 'Select',       icon: '◉'  },
  { type: 'multi_select', label: 'Multi-select', icon: '⊕'  },
  { type: 'date',         label: 'Date',         icon: '📅' },
  { type: 'checkbox',     label: 'Checkbox',     icon: '☑'  },
  { type: 'url',          label: 'URL',          icon: '🔗' },
  { type: 'email',        label: 'Email',        icon: '✉'  },
  { type: 'rating',       label: 'Rating',       icon: '★'  },
  { type: 'image',        label: 'Image',        icon: '🖼'  },
]

export type SelectOption = { id: string; label: string; color: string }

export const SELECT_COLORS = [
  { name: 'gray',   bg: 'bg-zinc-700',   text: 'text-zinc-200' },
  { name: 'red',    bg: 'bg-red-800',    text: 'text-red-200'  },
  { name: 'orange', bg: 'bg-orange-800', text: 'text-orange-200' },
  { name: 'yellow', bg: 'bg-yellow-800', text: 'text-yellow-200' },
  { name: 'green',  bg: 'bg-green-800',  text: 'text-green-200' },
  { name: 'blue',   bg: 'bg-blue-800',   text: 'text-blue-200'  },
  { name: 'purple', bg: 'bg-purple-800', text: 'text-purple-200' },
]

const NAMED_COLOR_HEX: Record<string, string> = {
  gray:   '#52525b',
  red:    '#991b1b',
  orange: '#9a3412',
  yellow: '#854d0e',
  green:  '#166534',
  blue:   '#1e40af',
  purple: '#6b21a8',
}

/** Returns inline style-ready background + text color for any option color (named or hex). */
export function getOptionStyle(color: string): { background: string; color: string } {
  const bg = color.startsWith('#') ? color : (NAMED_COLOR_HEX[color] ?? '#52525b')
  return { background: bg, color: '#ffffff' }
}
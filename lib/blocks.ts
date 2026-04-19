export type BlockType =
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bullet_list'
  | 'numbered_list'
  | 'todo'
  | 'quote'
  | 'callout'
  | 'code'
  | 'divider'
  | 'image'
  | 'database_table'
  | 'ai_table'
  | 'database_stat'
  | 'database_chart'
  | 'database_chart_row'
  | 'alarm'

export type ChartConfig = {
  chartType: string
  chartTitle: string
  chartGroupBy: string
  chartMetric: string
}

export type BlockContent = {
  text?: string
  checked?: boolean
  language?: string
  url?: string
  caption?: string
  emoji?: string
  databaseId?: string
  // stat block
  statLabel?: string
  statFormula?: string
  statColumn?: string
  statFilterValue?: string
  // chart block
  chartType?: string
  chartTitle?: string
  chartGroupBy?: string
  chartMetric?: string
  // chart row block
  charts?: (ChartConfig | null)[]
}

export type Block = {
  id: string
  type: BlockType
  content: string | null
  order: number
  pageId: string
  parentId: string | null
  isDeleted?: boolean
  children?: Block[]
}

export const BLOCK_MENU: {
  type: BlockType
  label: string
  icon: string
  description: string
}[] = [
  { type: 'text', label: 'Text', icon: 'P', description: 'Plain text paragraph' },
  { type: 'heading1', label: 'Heading 1', icon: 'H1', description: 'Large section heading' },
  { type: 'heading2', label: 'Heading 2', icon: 'H2', description: 'Medium section heading' },
  { type: 'heading3', label: 'Heading 3', icon: 'H3', description: 'Small section heading' },
  { type: 'bullet_list', label: 'Bullet List', icon: '•', description: 'Unordered list' },
  { type: 'numbered_list', label: 'Numbered List', icon: '1.', description: 'Ordered list' },
  { type: 'todo', label: 'To-do', icon: '[]', description: 'Checkbox task' },
  { type: 'quote', label: 'Quote', icon: '"', description: 'Highlighted quote' },
  { type: 'callout', label: 'Callout', icon: '!', description: 'Callout box with emoji' },
  { type: 'code', label: 'Code', icon: '<>', description: 'Code block' },
  { type: 'database_table', label: 'Table', icon: 'Tbl', description: 'Create an editable database table' },
  { type: 'database_chart_row', label: 'Chart Row', icon: '▦', description: 'Row of up to 4 mini charts from a table' },
  { type: 'divider', label: 'Divider', icon: '---', description: 'Horizontal line' },
  { type: 'image', label: 'Image', icon: 'Img', description: 'Upload or embed image' },
  { type: 'alarm', label: 'Reminder', icon: '⏰', description: 'Set an email reminder' },
]

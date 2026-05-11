export type TagNode = {
  id: string
  name: string
  children?: TagNode[]
  data?: string
}

export type TagNodeExport = {
  name: string
  children?: TagNodeExport[]
  data?: string
}


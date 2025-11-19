export type SpaceItem = {
  itemId: string
  itemName: string
  itemType: "Space" | "Project" | "Folder" | "Task"
  author: string
  parentId: string
  subRows?: SpaceItem[] // Add optional subRows for hierarchical structure
}


export function buildDataTree(data: SpaceItem[]): SpaceItem[] {
  const map = new Map<string, SpaceItem>() // Map by itemId for quick lookup
  const roots: SpaceItem[] = []

  // First, clone items into map (so we can safely mutate subRows)
  data.forEach((item) => {
    map.set(item.itemId, { ...item, subRows: [] })
  })

  // Then, assign children to their parents
  map.forEach((item) => {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.subRows!.push(item)
    } else {
      roots.push(item) // No parent => top-level row
    }
  })

  return roots
}
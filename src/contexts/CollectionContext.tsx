'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { collectionService } from '../services/collectionService'
import { useAuth } from './AuthContext'
import type { Collection } from '../types'

interface CollectionContextValue {
  collections: Collection[]
  loading: boolean
  refresh: () => Promise<void>
  createCollection: (name: string, parentId?: number | null) => Promise<Collection>
  renameCollection: (id: number, name: string) => Promise<void>
  moveCollection: (id: number, parentId: number | null) => Promise<void>
  deleteCollection: (id: number) => Promise<void>
}

const CollectionContext = createContext<CollectionContextValue | null>(null)

// Every collection id in id's subtree (id included), walked via the local
// parent_id links — used so deleting a folder can drop its whole subtree from
// state immediately instead of waiting on a refetch (the server cascades the
// same way), and by the settings modal to exclude a collection's own subtree
// from its "move to folder" picker (moving into your own descendant would be
// a cycle, rejected server-side, but filtering it out is a better UX).
export function subtreeIds(all: Collection[], id: number): number[] {
  const out = [id]
  for (const c of all) {
    if (c.parent_id === id) out.push(...subtreeIds(all, c.id))
  }
  return out
}

export function CollectionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    const cols = await collectionService.listCollections()
    setCollections(cols)
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    collectionService.listCollections().then((cols) => {
      setCollections(cols)
      setLoading(false)
    })
  }, [isAuthenticated])

  const createCollection = useCallback(async (name: string, parentId?: number | null): Promise<Collection> => {
    const col = await collectionService.createCollection(name, parentId)
    setCollections((prev) => [...prev, col])
    return col
  }, [])

  const renameCollection = useCallback(async (id: number, name: string) => {
    await collectionService.renameCollection(id, name)
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))
  }, [])

  const moveCollection = useCallback(async (id: number, parentId: number | null) => {
    await collectionService.moveCollection(id, parentId)
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, parent_id: parentId } : c)))
  }, [])

  const deleteCollection = useCallback(async (id: number) => {
    await collectionService.deleteCollection(id)
    setCollections((prev) => {
      const doomed = new Set(subtreeIds(prev, id))
      return prev.filter((c) => !doomed.has(c.id))
    })
  }, [])

  return (
    <CollectionContext.Provider value={{ collections, loading, refresh, createCollection, renameCollection, moveCollection, deleteCollection }}>
      {children}
    </CollectionContext.Provider>
  )
}

export function useCollections() {
  const ctx = useContext(CollectionContext)
  if (!ctx) throw new Error('useCollections must be used inside CollectionProvider')
  return ctx
}

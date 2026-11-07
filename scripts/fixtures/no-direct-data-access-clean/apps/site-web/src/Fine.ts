// None of these is data access: comments and strings mention fetch('/x') and supabase.from('y').
const note = "call fetch( later"
const refetch = (n: number) => n
const list = Array.from([1, 2])
const prefetchAll = (items: number[]) => items
export const ok = [note, refetch(1), list, prefetchAll([])]

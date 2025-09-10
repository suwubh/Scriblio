import * as Y from 'yjs'

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const mergeYMaps = (target: Y.Map<any>, source: Y.Map<any>): void => {
  source.forEach((value, key) => {
    target.set(key, value)
  })
}

export const yMapToObject = <T>(ymap: Y.Map<T>): Record<string, T> => {
  const obj: Record<string, T> = {}
  ymap.forEach((value, key) => {
    obj[key] = value
  })
  return obj
}

export const yArrayToArray = <T>(yarray: Y.Array<T>): T[] => {
  return yarray.toArray()
}

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj))
}

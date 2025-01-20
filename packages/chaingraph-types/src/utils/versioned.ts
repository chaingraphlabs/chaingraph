export interface Versioned<T> {
  value: T
  version: number
}

export function createVersioned<T>(value: T, version: number): Versioned<T> {
  return { value, version }
}

export function getVersionedValue<T>(versioned: Versioned<T>): T {
  return versioned.value
}

export function getVersionedVersion<T>(versioned: Versioned<T>): number {
  return versioned.version
}

export function setVersionedValue<T>(versioned: Versioned<T>, value: T): Versioned<T> {
  return { ...versioned, value }
}

export function setVersionedVersion<T>(versioned: Versioned<T>, version: number): Versioned<T> {
  return { ...versioned, version }
}

export function updateVersioned<T>(versioned: Versioned<T>, value: T, version: number): Versioned<T> {
  return { value, version }
}

export function incrementVersioned<T>(versioned: Versioned<T>): Versioned<T> {
  return updateVersioned(versioned, versioned.value, versioned.version + 1)
}

import { useUnit } from 'effector-react'
import {
  $categoriesState,
  $categoryMetadataGetter,
} from '../stores'

export function useCategories() {
  const state = useUnit($categoriesState)
  const getCategoryMetadata = useUnit($categoryMetadataGetter)

  return {
    ...state,
    getCategoryMetadata,
  }
}

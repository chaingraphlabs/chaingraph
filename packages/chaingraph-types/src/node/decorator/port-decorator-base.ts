import type { PortValueFromConfig } from '@chaingraph/types'
import { updatePortConfig } from '@chaingraph/types'

export function Description(description: string) {
  return function (target: any, propertyKey: string) {
    updatePortConfig(target, propertyKey, (config) => {
      config.description = description
    })
  }
}

export function Name(name: string) {
  return function (target: any, propertyKey: string) {
    updatePortConfig(target, propertyKey, (config) => {
      config.key = name
    })
  }
}

export function Id(id: string) {
  return function (target: any, propertyKey: string) {
    updatePortConfig(target, propertyKey, (config) => {
      config.id = id
    })
  }
}

export function DefaultValue(value: PortValueFromConfig<any>) {
  return function (target: any, propertyKey: string) {
    updatePortConfig(target, propertyKey, (config) => {
      config.defaultValue = value
    })
  }
}

export function Required() {
  return function (target: any, propertyKey: string) {
    updatePortConfig(target, propertyKey, (config) => {
      config.optional = false
    })
  }
}

export function Optional() {
  return function (target: any, propertyKey: string) {
    updatePortConfig(target, propertyKey, (config) => {
      config.optional = true
    })
  }
}

export function Title(title: string) {
  return function (target: any, propertyKey: string) {
    updatePortConfig(target, propertyKey, (config) => {
      config.title = title
    })
  }
}

export function Metadata(key: string, value: any) {
  return function (target: any, propertyKey: string) {
    updatePortConfig(target, propertyKey, (config) => {
      if (!config.metadata) {
        config.metadata = {}
      }
      config.metadata[key] = value
    })
  }
}

export function Validation(validationRules: any) {
  return function (target: any, propertyKey: string) {
    updatePortConfig(target, propertyKey, (config) => {
      config.validation = validationRules
    })
  }
}

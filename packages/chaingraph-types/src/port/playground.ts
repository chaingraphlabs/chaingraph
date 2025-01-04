import type { EnumPortConfig, StringPortConfig } from './types'
import { PortFactory } from './port-factory'

// Define option ports
const redOptionConfig: StringPortConfig = {
  id: 'red',
  name: 'Red',
  kind: 'string',
  defaultValue: 'Red Color',
}

const greenOptionConfig: StringPortConfig = {
  id: 'green',
  name: 'Green',
  kind: 'string',
  defaultValue: 'Green Color',
}

const blueOptionConfig: StringPortConfig = {
  id: 'blue',
  name: 'Blue',
  kind: 'string',
  defaultValue: 'Blue Color',
}

// Define an EnumPortConfig
const enumPortConfig: EnumPortConfig<StringPortConfig> = {
  id: 'colorSelector',
  name: 'Color Selector',
  kind: 'enum',
  options: [redOptionConfig, greenOptionConfig, blueOptionConfig],
  defaultValue: 'red',
}

// Create an EnumPort instance
const enumPort = PortFactory.create(enumPortConfig)

// Accessing the value
console.log(enumPort.getValue()) // Output: 'red'

// Add a new option at runtime
const yellowOptionConfig: StringPortConfig = {
  id: 'yellow',
  name: 'Yellow',
  kind: 'string',
  defaultValue: 'Yellow Color',
}

enumPort.addOption(yellowOptionConfig)

// Set the new value
enumPort.setValue('yellow')
console.log(enumPort.getValue()) // Output: 'yellow'

// Remove an option
enumPort.removeOption('blue')

// Try to set a removed option
try {
  enumPort.setValue('blue')
} catch (error) {
  console.error(error.message) // Output: Invalid value 'blue'. Must be one of the option IDs.
}

// Get all options
const options = enumPort.getOptions()
options.forEach((option) => {
  console.log(`${option.config.id}: ${option.getValue()}`)
})
// Output:
// red: Red Color
// green: Green Color
// yellow: Yellow Color

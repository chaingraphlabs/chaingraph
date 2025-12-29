/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { BooleanPortConfig, IPortConfig, NumberPortConfig, PortType, SecretType, StringPortConfig } from '@badaitech/chaingraph-types'
import { PORT_TYPES, secretTypeSchemas } from '@badaitech/chaingraph-types'
import { ChevronDown, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PopoverContent } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { usePortConfigWithExecution, usePortUIWithExecution } from '@/store/execution'
import { useFocusTracking } from '@/store/focused-editors/hooks/useFocusTracking'
import { usePortUI } from '@/store/ports-v2'

interface Data {
  key: string
  config: IPortConfig
}

interface Props {
  onClose: () => void
  onSubmit: (data: Data) => void
  onDelete?: () => void
  nextOrder?: number
  nodeId: string
  portId: string
  editMode?: boolean
}

export function AddPropPopover(props: Props) {
  const { onClose, onSubmit, onDelete, nodeId, portId, editMode = false } = props

  // Get port UI state for allowed types
  const ui = usePortUI(nodeId, portId)

  // Get config and UI for edit mode (only subscribes when component is rendered)
  const portConfig = usePortConfigWithExecution(nodeId, portId)
  const portUI = usePortUIWithExecution(nodeId, portId)

  // Build existingField internally when in editMode
  const existingField = editMode && portConfig
    ? {
        key: portConfig.key ?? '',
        config: { ...portConfig, ui: portUI } as IPortConfig,
      }
    : undefined

  const [key, setKey] = useState(existingField?.key || '')

  // Track focus/blur for global copy-paste functionality
  const { handleFocus: trackFocus, handleBlur: trackBlur } = useFocusTracking(nodeId, portId)

  // Universal fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [required, setRequired] = useState(false)

  // Type-specific fields (string)
  const [stringDefaultValue, setStringDefaultValue] = useState('')
  const [minLength, setMinLength] = useState<number | undefined>()
  const [maxLength, setMaxLength] = useState<number | undefined>()
  const [pattern, setPattern] = useState('')

  // Type-specific fields (number)
  const [numberDefaultValue, setNumberDefaultValue] = useState<number | undefined>(0)
  const [min, setMin] = useState<number | undefined>()
  const [max, setMax] = useState<number | undefined>()
  const [step, setStep] = useState<number | undefined>()
  const [integer, setInteger] = useState(false)

  // Type-specific fields (boolean)
  const [booleanDefaultValue, setBooleanDefaultValue] = useState(false)

  // Order field
  const [order, setOrder] = useState<number>(props.nextOrder ?? 0)

  // Enum options
  const [enumOptions, setEnumOptions] = useState<Array<{ id: string, value: string }>>([])
  const [enumDefaultValue, setEnumDefaultValue] = useState<string>('')

  // Secret type
  const [secretType, setSecretType] = useState<string>('string')

  // String UI options
  const [placeholder, setPlaceholder] = useState('')
  const [isTextArea, setIsTextArea] = useState(false)
  const [isPassword, setIsPassword] = useState(false)

  // Number UI options
  const [isSlider, setIsSlider] = useState(false)
  const [leftSliderLabel, setLeftSliderLabel] = useState('')
  const [rightSliderLabel, setRightSliderLabel] = useState('')

  // Base UI option
  const [hideEditor, setHideEditor] = useState(false)

  // Type config map - functions to build configs from current state
  const typeConfigMap: Record<PortType, () => IPortConfig> = {
    string: () => ({
      type: 'string',
      defaultValue: stringDefaultValue,
      minLength,
      maxLength,
      pattern: pattern || undefined,
      title: title || undefined,
      description: description || undefined,
      required: required || undefined,
      ui: {
        hideEditor,
        placeholder: placeholder || undefined,
        isTextArea: isTextArea || undefined,
        isPassword: isPassword || undefined,
      },
    } as StringPortConfig),
    number: () => ({
      type: 'number',
      defaultValue: numberDefaultValue ?? 0,
      min,
      max,
      step,
      integer: integer || undefined,
      title: title || undefined,
      description: description || undefined,
      required: required || undefined,
      ui: {
        hideEditor,
        isSlider: isSlider || undefined,
        leftSliderLabel: leftSliderLabel || undefined,
        rightSliderLabel: rightSliderLabel || undefined,
      },
    } as NumberPortConfig),
    boolean: () => ({
      type: 'boolean',
      defaultValue: booleanDefaultValue,
      title: title || undefined,
      description: description || undefined,
      required: required || undefined,
      ui: {
        hideEditor,
      },
    } as BooleanPortConfig),
    enum: () => ({
      type: 'enum',
      options: enumOptions.map(opt => ({
        id: opt.value || opt.id,
        type: 'string' as const,
        defaultValue: opt.value,
        title: opt.value,
      })),
      defaultValue: enumDefaultValue || '',
      title: title || undefined,
      description: description || undefined,
      required: required || undefined,
      ui: {
        hideEditor,
      },
    }),
    stream: () => ({
      type: 'stream',
      itemConfig: {},
      title: title || undefined,
      description: description || undefined,
      required: required || undefined,
      ui: {
        hideEditor,
      },
    }),
    object: () => ({
      type: 'object',
      schema: {
        properties: {},
      },
      defaultValue: {},
      isSchemaMutable: true,
      title: title || undefined,
      description: description || undefined,
      required: required || undefined,
      ui: {
        hideEditor,
        keyDeletable: true,
      },
    }),
    array: () => ({
      type: 'array',
      itemConfig: {
        type: 'any',
      },
      defaultValue: [],
      isMutable: true,
      isSchemaMutable: true,
      title: title || undefined,
      description: description || undefined,
      required: required || undefined,
      ui: {
        hideEditor,
        allowedTypes: ['string', 'number', 'boolean'],
      },
    }),
    any: () => ({
      type: 'any',
      defaultValue: null,
      title: title || undefined,
      description: description || undefined,
      required: required || undefined,
      ui: {
        hideEditor,
      },
    }),
    secret: () => ({
      type: 'secret',
      secretType: secretType as SecretType,
      defaultValue: undefined,
      title: title || undefined,
      description: description || undefined,
      required: required || undefined,
      ui: {
        hideEditor: true, // Keep true for secrets (security)
      },
    }),
  }

  // use all porttypes if allowedTypes undefined and filter stream out
  const objectUI = ui as { allowedTypes?: PortType[] }
  const dropDownValues = (objectUI.allowedTypes || PORT_TYPES).filter(t => t !== 'stream')

  const [type, setType] = useState<PortType | undefined>(
    existingField?.config.type || dropDownValues.at(0),
  )
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Populate all fields when in edit mode
  useEffect(() => {
    if (editMode && existingField) {
      const config = existingField.config

      // Universal fields
      setTitle(config.title || '')
      setDescription(config.description || '')
      setRequired(config.required || false)
      setOrder(config.order ?? props.nextOrder ?? 0)
      setHideEditor(config.ui?.hideEditor || false)

      // String-specific fields
      if (config.type === 'string') {
        setStringDefaultValue(config.defaultValue || '')
        setMinLength(config.minLength)
        setMaxLength(config.maxLength)
        setPattern(config.pattern || '')
        setPlaceholder(config.ui?.placeholder || '')
        setIsTextArea(config.ui?.isTextArea || false)
        setIsPassword(config.ui?.isPassword || false)
      }

      // Number-specific fields
      if (config.type === 'number') {
        setNumberDefaultValue(config.defaultValue ?? 0)
        setMin(config.min)
        setMax(config.max)
        setStep(config.step)
        setInteger(config.integer || false)
        setIsSlider(config.ui?.isSlider || false)
        setLeftSliderLabel(config.ui?.leftSliderLabel || '')
        setRightSliderLabel(config.ui?.rightSliderLabel || '')
      }

      // Boolean-specific fields
      if (config.type === 'boolean') {
        setBooleanDefaultValue(config.defaultValue || false)
      }

      // Enum-specific fields
      if (config.type === 'enum') {
        const opts = config.options.map((opt, idx) => ({
          id: opt.id || `opt-${idx}`,
          value: opt.defaultValue as string || '',
        }))
        setEnumOptions(opts)
        setEnumDefaultValue(config.defaultValue as string || '')
      }

      // Secret-specific fields
      if (config.type === 'secret') {
        setSecretType(config.secretType)
      }
    }
  }, [editMode, existingField, props.nextOrder])

  /**
   * Reset form to default values
   * Called after successful submission to clean state for next "Add field"
   */
  const resetForm = () => {
    // Key
    setKey('')

    // Universal fields
    setTitle('')
    setDescription('')
    setRequired(false)
    setOrder(props.nextOrder ?? 0)
    setHideEditor(false)

    // String fields
    setStringDefaultValue('')
    setMinLength(undefined)
    setMaxLength(undefined)
    setPattern('')
    setPlaceholder('')
    setIsTextArea(false)
    setIsPassword(false)

    // Number fields
    setNumberDefaultValue(0)
    setMin(undefined)
    setMax(undefined)
    setStep(undefined)
    setInteger(false)
    setIsSlider(false)
    setLeftSliderLabel('')
    setRightSliderLabel('')

    // Boolean fields
    setBooleanDefaultValue(false)

    // Enum fields
    setEnumOptions([])
    setEnumDefaultValue('')

    // Secret fields
    setSecretType('string')

    // Type (reset to first allowed type)
    setType(dropDownValues.at(0))
    setIsDropdownOpen(false)
  }

  const handleSubmit = () => {
    if (!type || !key)
      return

    // Validate enum has at least one option
    if (type === 'enum' && enumOptions.length === 0)
      return

    const configBuilder = typeConfigMap[type]
    if (!configBuilder)
      return

    const newPortConfig: IPortConfig = {
      ...configBuilder(), // Call function to get config with current state
      order, // Use the order state
    }

    onSubmit({
      key,
      config: newPortConfig,
    })

    // Reset form after successful submission (for next "Add field")
    if (!editMode) {
      resetForm()
    }
  }

  return (
    <PopoverContent className="flex flex-col w-[360px]" align="start" side="bottom">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <h4 className="font-semibold text-sm">
          {editMode ? 'Edit Object Field' : 'Add Object Field'}
        </h4>
        <X
          className="size-4 cursor-pointer hover:brightness-125"
          onClick={onClose}
        />
      </header>

      <ScrollArea className="h-[400px] px-4 py-3">
        <div className="flex flex-col gap-3">
          {/* Key Field */}
          <div>
            <Label htmlFor="field-key" className="text-xs text-muted-foreground">
              Key
              {' '}
              <span className="text-destructive">*</span>
            </Label>
            <Input
              id="field-key"
              value={key}
              onChange={e => setKey(e.target.value)}
              onFocus={trackFocus}
              onBlur={trackBlur}
              placeholder="key name"
              disabled={editMode}
              className="mt-1"
            />
          </div>

          {/* Type Dropdown */}
          <div>
            <Label htmlFor="field-type" className="text-xs text-muted-foreground">
              Type
              {' '}
              <span className="text-destructive">*</span>
            </Label>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <div className="mt-1 w-full relative">
                  <Input
                    id="field-type"
                    value={type}
                    readOnly
                    className="w-full cursor-pointer"
                    onClick={() => setIsDropdownOpen(true)}
                    onFocus={trackFocus}
                    onBlur={trackBlur}
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                </div>
              </DropdownMenuTrigger>

              <DropdownMenuContent>
                {dropDownValues
                  .map(portType => (
                    <DropdownMenuItem
                      key={portType}
                      onClick={() => {
                        setType(portType as Exclude<PortType, 'any' | 'stream'>)
                        setIsDropdownOpen(false)
                      }}
                    >
                      {portType}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title Field */}
          <div>
            <Label htmlFor="field-title" className="text-xs text-muted-foreground">
              Title
            </Label>
            <Input
              id="field-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onFocus={trackFocus}
              onBlur={trackBlur}
              placeholder="Display label"
              className="mt-1"
            />
          </div>

          {/* Description Field */}
          <div>
            <Label htmlFor="field-description" className="text-xs text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="field-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onFocus={trackFocus}
              onBlur={trackBlur}
              placeholder="Help text"
              className="mt-1 min-h-[60px] resize-none"
            />
          </div>

          {/* Required Switch */}
          <div className="flex items-center justify-between">
            <Label htmlFor="field-required" className="text-xs text-muted-foreground">
              Required
            </Label>
            <Switch
              id="field-required"
              checked={required}
              onCheckedChange={setRequired}
            />
          </div>

          {/* Order Field */}
          <div>
            <Label htmlFor="field-order" className="text-xs text-muted-foreground">
              Order
            </Label>
            <Input
              id="field-order"
              type="number"
              min={0}
              value={order}
              onChange={e => setOrder(Number(e.target.value))}
              onFocus={trackFocus}
              onBlur={trackBlur}
              placeholder="0"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Display order in the object (lower = first)
            </p>
          </div>

          {/* Hide Editor (Base UI option for all types) */}
          <div className="flex items-center justify-between">
            <Label htmlFor="hide-editor" className="text-xs text-muted-foreground">
              Hide Editor
            </Label>
            <Switch
              id="hide-editor"
              checked={hideEditor}
              onCheckedChange={setHideEditor}
            />
          </div>

          {/* String Options */}
          {type === 'string' && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="text-xs font-medium text-muted-foreground">
                String Options
              </div>

              {/* Default Value */}
              <div>
                <Label htmlFor="string-default" className="text-xs text-muted-foreground">
                  Default Value
                </Label>
                <Input
                  id="string-default"
                  value={stringDefaultValue}
                  onChange={e => setStringDefaultValue(e.target.value)}
                  onFocus={trackFocus}
                  onBlur={trackBlur}
                  placeholder="Default text"
                  className="mt-1"
                />
              </div>

              {/* Min/Max Length */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="string-min" className="text-xs text-muted-foreground">
                    Min Length
                  </Label>
                  <Input
                    id="string-min"
                    type="number"
                    min={0}
                    value={minLength ?? ''}
                    onChange={e => setMinLength(e.target.value ? Number(e.target.value) : undefined)}
                    onFocus={trackFocus}
                    onBlur={trackBlur}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="string-max" className="text-xs text-muted-foreground">
                    Max Length
                  </Label>
                  <Input
                    id="string-max"
                    type="number"
                    min={0}
                    value={maxLength ?? ''}
                    onChange={e => setMaxLength(e.target.value ? Number(e.target.value) : undefined)}
                    onFocus={trackFocus}
                    onBlur={trackBlur}
                    placeholder="∞"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Pattern */}
              <div>
                <Label htmlFor="string-pattern" className="text-xs text-muted-foreground">
                  Pattern (regex)
                </Label>
                <Input
                  id="string-pattern"
                  value={pattern}
                  onChange={e => setPattern(e.target.value)}
                  onFocus={trackFocus}
                  onBlur={trackBlur}
                  placeholder="^[a-z]+$"
                  className="mt-1 font-mono text-xs"
                />
              </div>

              {/* Placeholder */}
              <div>
                <Label htmlFor="string-placeholder" className="text-xs text-muted-foreground">
                  Placeholder
                </Label>
                <Input
                  id="string-placeholder"
                  value={placeholder}
                  onChange={e => setPlaceholder(e.target.value)}
                  onFocus={trackFocus}
                  onBlur={trackBlur}
                  placeholder="Enter placeholder text..."
                  className="mt-1"
                />
              </div>

              {/* Display Options */}
              <div className="space-y-2 mt-3 pt-3 border-t">
                <div className="text-xs font-medium text-muted-foreground">
                  Display Options
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="string-textarea" className="text-xs text-muted-foreground">
                    Show as Textarea
                  </Label>
                  <Switch
                    id="string-textarea"
                    checked={isTextArea}
                    onCheckedChange={setIsTextArea}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="string-password" className="text-xs text-muted-foreground">
                    Show as Password
                  </Label>
                  <Switch
                    id="string-password"
                    checked={isPassword}
                    onCheckedChange={setIsPassword}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Number Options */}
          {type === 'number' && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="text-xs font-medium text-muted-foreground">
                Number Options
              </div>

              {/* Default Value */}
              <div>
                <Label htmlFor="number-default" className="text-xs text-muted-foreground">
                  Default Value
                </Label>
                <Input
                  id="number-default"
                  type="number"
                  value={numberDefaultValue ?? ''}
                  onChange={e => setNumberDefaultValue(e.target.value ? Number(e.target.value) : undefined)}
                  onFocus={trackFocus}
                  onBlur={trackBlur}
                  placeholder="0"
                  className="mt-1"
                />
              </div>

              {/* Min/Max */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="number-min" className="text-xs text-muted-foreground">
                    Min
                  </Label>
                  <Input
                    id="number-min"
                    type="number"
                    value={min ?? ''}
                    onChange={e => setMin(e.target.value ? Number(e.target.value) : undefined)}
                    onFocus={trackFocus}
                    onBlur={trackBlur}
                    placeholder="-∞"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="number-max" className="text-xs text-muted-foreground">
                    Max
                  </Label>
                  <Input
                    id="number-max"
                    type="number"
                    value={max ?? ''}
                    onChange={e => setMax(e.target.value ? Number(e.target.value) : undefined)}
                    onFocus={trackFocus}
                    onBlur={trackBlur}
                    placeholder="∞"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Step */}
              <div>
                <Label htmlFor="number-step" className="text-xs text-muted-foreground">
                  Step
                </Label>
                <Input
                  id="number-step"
                  type="number"
                  min={0}
                  step="any"
                  value={step ?? ''}
                  onChange={e => setStep(e.target.value ? Number(e.target.value) : undefined)}
                  onFocus={trackFocus}
                  onBlur={trackBlur}
                  placeholder="1"
                  className="mt-1"
                />
              </div>

              {/* Integer Only */}
              <div className="flex items-center justify-between">
                <Label htmlFor="number-integer" className="text-xs text-muted-foreground">
                  Integer Only
                </Label>
                <Switch
                  id="number-integer"
                  checked={integer}
                  onCheckedChange={setInteger}
                />
              </div>

              {/* Display Options */}
              <div className="space-y-2 mt-3 pt-3 border-t">
                <div className="text-xs font-medium text-muted-foreground">
                  Display Options
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="number-slider" className="text-xs text-muted-foreground">
                    Show as Slider
                  </Label>
                  <Switch
                    id="number-slider"
                    checked={isSlider}
                    onCheckedChange={setIsSlider}
                  />
                </div>

                {isSlider && (
                  <>
                    <div>
                      <Label htmlFor="slider-left-label" className="text-xs text-muted-foreground">
                        Left Label
                      </Label>
                      <Input
                        id="slider-left-label"
                        value={leftSliderLabel}
                        onChange={e => setLeftSliderLabel(e.target.value)}
                        onFocus={trackFocus}
                        onBlur={trackBlur}
                        placeholder="Min"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="slider-right-label" className="text-xs text-muted-foreground">
                        Right Label
                      </Label>
                      <Input
                        id="slider-right-label"
                        value={rightSliderLabel}
                        onChange={e => setRightSliderLabel(e.target.value)}
                        onFocus={trackFocus}
                        onBlur={trackBlur}
                        placeholder="Max"
                        className="mt-1"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Boolean Options */}
          {type === 'boolean' && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="text-xs font-medium text-muted-foreground">
                Boolean Options
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="boolean-default" className="text-xs text-muted-foreground">
                  Default Value
                </Label>
                <Switch
                  id="boolean-default"
                  checked={booleanDefaultValue}
                  onCheckedChange={setBooleanDefaultValue}
                />
              </div>
            </div>
          )}

          {/* Enum Options */}
          {type === 'enum' && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="text-xs font-medium text-muted-foreground">
                Enum Options
              </div>

              {/* List of options */}
              <div className="space-y-2">
                {enumOptions.map((opt, index) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <Input
                      value={opt.value}
                      onChange={(e) => {
                        const newOptions = [...enumOptions]
                        newOptions[index] = { ...opt, value: e.target.value }
                        setEnumOptions(newOptions)
                      }}
                      onFocus={trackFocus}
                      onBlur={trackBlur}
                      placeholder="Option value"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newOptions = enumOptions.filter((_, i) => i !== index)
                        setEnumOptions(newOptions)
                        // Clear default value if it was the deleted option
                        if (enumDefaultValue === opt.value) {
                          setEnumDefaultValue('')
                        }
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add option button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newId = `opt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
                  setEnumOptions([...enumOptions, { id: newId, value: '' }])
                }}
                className="w-full"
              >
                Add Option
              </Button>

              {/* Default Value Selector */}
              {enumOptions.length > 0 && (
                <div>
                  <Label htmlFor="enum-default" className="text-xs text-muted-foreground">
                    Default Value
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="mt-1 w-full relative">
                        <Input
                          id="enum-default"
                          value={enumDefaultValue || '(empty)'}
                          readOnly
                          className="w-full cursor-pointer"
                          onFocus={trackFocus}
                          onBlur={trackBlur}
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                      </div>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={() => setEnumDefaultValue('')}
                      >
                        (empty)
                      </DropdownMenuItem>
                      {enumOptions.filter(opt => opt.value).map(opt => (
                        <DropdownMenuItem
                          key={opt.id}
                          onClick={() => setEnumDefaultValue(opt.value)}
                        >
                          {opt.value}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              {enumOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Add at least one option for the enum
                </p>
              )}
            </div>
          )}

          {/* Secret Type Selector */}
          {type === 'secret' && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="text-xs font-medium text-muted-foreground">
                Secret Type
              </div>

              <div>
                <Label htmlFor="secret-type" className="text-xs text-muted-foreground">
                  Type
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="mt-1 w-full relative">
                      <Input
                        id="secret-type"
                        value={secretType}
                        readOnly
                        className="w-full cursor-pointer"
                        onFocus={trackFocus}
                        onBlur={trackBlur}
                      />
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                    </div>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent className="max-h-[300px] overflow-auto">
                    {Object.keys(secretTypeSchemas).map(st => (
                      <DropdownMenuItem
                        key={st}
                        onClick={() => setSecretType(st)}
                      >
                        {st}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex items-center justify-between px-4 py-3 border-t">
        {editMode && onDelete
          ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete()
                  onClose()
                }}
              >
                Delete
              </Button>
            )
          : <div />}

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!key || !type || (type === 'enum' && enumOptions.length === 0)}
            onClick={handleSubmit}
          >
            {editMode ? 'Save' : 'Add'}
          </Button>
        </div>
      </div>
    </PopoverContent>
  )
}

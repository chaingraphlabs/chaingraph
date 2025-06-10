/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { ExecutionContext } from '../../execution'
import type { IPort, IPortConfig } from '../../port'
import type { IDefaultPortManager, INodeComposite, IPortManager } from '../interfaces'
import { errorID, errorMessageID, getDefaultPortConfigs } from '../default-ports'

/**
 * Implementation of IDefaultPortManager interface
 * Manages default system ports for nodes
 */
export class DefaultPortManager implements IDefaultPortManager {
  constructor(
    private portManager: IPortManager,
    private nodeRef: INodeComposite,
  ) {}

  /**
   * Get all default system ports
   */
  getDefaultPorts(): IPort[] {
    return Array.from(this.portManager.ports.values())
      .filter(port => port.isSystem())
  }

  /**
   * Get default port configurations based on flowPorts settings
   */
  getDefaultPortConfigs(): IPortConfig[] {
    return getDefaultPortConfigs(this.nodeRef.metadata.flowPorts)
  }

  /**
   * Check if a port is a system default port
   */
  isDefaultPort(portId: string): boolean {
    const port = this.portManager.getPort(portId)
    return port?.getConfig()?.metadata?.isSystemPort === true
  }

  /**
   * Get the flowIn port if it exists
   */
  getFlowInPort(): IPort | undefined {
    return Array.from(this.portManager.ports.values())
      .find(port =>
        port.isSystem()
        && !port.isSystemError()
        && port.getConfig()?.direction === 'input',
      )
  }

  /**
   * Get the flowOut port if it exists
   */
  getFlowOutPort(): IPort | undefined {
    return Array.from(this.portManager.ports.values())
      .find(port =>
        port.isSystem()
        && !port.isSystemError()
        && port.getConfig()?.direction === 'output',
      )
  }

  /**
   * Get the error port if it exists
   */
  getErrorPort(): IPort | undefined {
    return Array.from(this.portManager.ports.values())
      .find(port =>
        port.isSystemError()
        && port.getConfig()?.key === errorID,
      )
  }

  /**
   * Get the errorMessage port if it exists
   */
  getErrorMessagePort(): IPort | undefined {
    return Array.from(this.portManager.ports.values())
      .find(port =>
        port.isSystemError()
        && port.getConfig()?.key === errorMessageID,
      )
  }

  /**
   * Determine if node should execute based on flow ports configuration
   */
  shouldExecute(context: ExecutionContext): boolean {
    // If flow ports are disabled, always execute unless auto-execution is disabled
    if (this.nodeRef.metadata.flowPorts?.disabledFlowPorts) {
      return !this.nodeRef.metadata.flowPorts?.disabledAutoExecution
    }

    // Otherwise, check flowIn port value
    const flowInPort = this.getFlowInPort()
    const flowAllowed = flowInPort?.getValue() === true
    if (!flowAllowed) {
      return false
    }

    return flowAllowed
  }

  /**
   * Update flow and error ports after execution
   */
  async updatePortsAfterExecution(success: boolean, errorMessage?: string): Promise<void> {
    const flowOutPort = this.getFlowOutPort()
    const errorPort = this.getErrorPort()
    const errorMessagePort = this.getErrorMessagePort()

    // Update flowOut port
    if (flowOutPort) {
      flowOutPort.setValue(success)
      this.portManager.updatePort(flowOutPort)
    }

    // Update error port if execution failed
    if (!success && errorPort) {
      errorPort.setValue(true)
      this.portManager.updatePort(errorPort)
    }

    // Update errorMessage port if provided
    if (!success && errorMessage && errorMessagePort) {
      errorMessagePort.setValue(errorMessage)
      this.portManager.updatePort(errorMessagePort)
    }
  }
}

/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import type { IPort, IPortConfig } from '../../port'
import type { IDefaultPortManager, IPortManager } from '../interfaces'
import type { FlowPorts } from '../types'
import { errorID, errorMessageID, flowInID, flowOutID, getDefaultPortConfigs } from '../default-ports'

/**
 * Implementation of IDefaultPortManager interface
 * Manages default system ports for nodes
 */
export class DefaultPortManager implements IDefaultPortManager {
  constructor(
    private portManager: IPortManager,
    private metadata: { flowPorts?: FlowPorts },
  ) {}

  /**
   * Get all default system ports
   */
  getDefaultPorts(): IPort[] {
    return Array.from(this.portManager.ports.values())
      .filter(port => port.getConfig()?.metadata?.isSystemPort === true)
  }

  /**
   * Get default port configurations based on flowPorts settings
   */
  getDefaultPortConfigs(): IPortConfig[] {
    return getDefaultPortConfigs(this.metadata.flowPorts)
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
        port.getConfig()?.metadata?.isSystemPort === true
        && port.getConfig()?.key === flowInID,
      )
  }

  /**
   * Get the flowOut port if it exists
   */
  getFlowOutPort(): IPort | undefined {
    return Array.from(this.portManager.ports.values())
      .find(port =>
        port.getConfig()?.metadata?.isSystemPort === true
        && port.getConfig()?.key === flowOutID,
      )
  }

  /**
   * Get the error port if it exists
   */
  getErrorPort(): IPort | undefined {
    return Array.from(this.portManager.ports.values())
      .find(port =>
        port.getConfig()?.metadata?.isSystemPort === true
        && port.getConfig()?.key === errorID,
      )
  }

  /**
   * Get the errorMessage port if it exists
   */
  getErrorMessagePort(): IPort | undefined {
    return Array.from(this.portManager.ports.values())
      .find(port =>
        port.getConfig()?.metadata?.isSystemPort === true
        && port.getConfig()?.key === errorMessageID,
      )
  }

  /**
   * Determine if node should execute based on flow ports configuration
   */
  shouldExecute(): boolean {
    // If flow ports are disabled, always execute unless auto-execution is disabled
    if (this.metadata.flowPorts?.disabledFlowPorts) {
      return !this.metadata.flowPorts?.disabledAutoExecution
    }

    // Otherwise, check flowIn port value
    const flowInPort = this.getFlowInPort()
    return flowInPort?.getValue() === true
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
      await this.portManager.updatePort(flowOutPort)
    }

    // Update error port if execution failed
    if (!success && errorPort) {
      errorPort.setValue(true)
      await this.portManager.updatePort(errorPort)
    }

    // Update errorMessage port if provided
    if (!success && errorMessage && errorMessagePort) {
      errorMessagePort.setValue(errorMessage)
      await this.portManager.updatePort(errorMessagePort)
    }
  }
}

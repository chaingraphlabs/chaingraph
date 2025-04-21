/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

export function ShadcnSafelist() {
  return (
    <div>
      {/* Accordion */}
      <div className="accordion accordion-open accordion-closed">
        <h3 className="accordion-trigger">
          <span className="accordion-icon"></span>
        </h3>
        <div className="accordion-content"></div>
      </div>

      {/* Alert */}
      <div className="alert alert-destructive">
        <div className="alert-title alert-description"></div>
      </div>

      {/* Alert Dialog */}
      <div className="alert-dialog">
        <div className="alert-dialog-overlay alert-dialog-content">
          <h2 className="alert-dialog-title alert-dialog-description"></h2>
          <div className="alert-dialog-footer">
            <button className="alert-dialog-action alert-dialog-cancel"></button>
          </div>
        </div>
      </div>

      {/* Button - all variants */}
      <button className="btn btn-default btn-destructive btn-outline btn-secondary btn-ghost btn-link btn-sm btn-lg"></button>

      {/* Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title card-description"></h3>
        </div>
        <div className="card-content card-footer"></div>
      </div>

      {/* Dialog */}
      <div className="dialog dialog-overlay dialog-content">
        <h2 className="dialog-title dialog-description"></h2>
        <div className="dialog-footer"></div>
        <button className="dialog-close"></button>
      </div>

      {/* Dropdown */}
      <div className="dropdown dropdown-content dropdown-item dropdown-checkitem dropdown-radioitem dropdown-label dropdown-separator dropdown-shortcut"></div>

      {/* Form elements */}
      <div className="form-item form-label form-control form-description form-message form-error">
        <input className="input" />
        <select className="select">
          <option className="select-item"></option>
        </select>
        <textarea className="textarea"></textarea>
        <div className="checkbox radio slider"></div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-list tabs-trigger tabs-content"></div>

      {/* Tooltip */}
      <div className="tooltip tooltip-content"></div>

      {/* Include states */}
      <div className="hover:bg-accent focus:ring-2 active:scale-95 disabled:opacity-50"></div>

      {/* Include all the shadcn/ui specific class variants */}
      <div className="data-[state=open]:block data-[state=closed]:hidden data-[disabled=true]:opacity-50 data-[highlighted=true]:bg-accent"></div>
    </div>
  )
}

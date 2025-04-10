/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

// import { useUnit } from 'effector-react'
// import { useEffect } from 'react'
// import { useNavigate, useParams } from 'react-router-dom'
// import { $activeFlowId, setActiveFlowId } from '../store/flow'
//
// export function useFlowUrlSync() {
//   const navigate = useNavigate()
//   const { flowId } = useParams()
//   const activeFlowId = useUnit($activeFlowId)
//
//   // Sync URL to store
//   useEffect(() => {
//     if (flowId && flowId !== activeFlowId)
//       setActiveFlowId(flowId)
//   }, [activeFlowId, flowId])
//
//   // Sync store to URL
//   // useEffect(() => {
//   //   if (activeFlowId)
//   //     navigate(`/flow/${activeFlowId}`, { replace: true })
//   //   else
//   //     navigate('/flows', { replace: true })
//   // }, [activeFlowId, navigate])
// }

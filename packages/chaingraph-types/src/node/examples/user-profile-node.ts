// import type { ExecutionContext, NodeExecutionResult } from '../execution'
// import { PortDirectionEnum } from '@chaingraph/types'
// import { PortObject } from '@chaingraph/types/node/decorator/port-decorator'
// import { BaseNode } from '../base-node'
// import { Node } from '../decorator/node-decorator'
// import { Address, UserProfile } from './user-profile'
// import 'reflect-metadata'
//
// @Node({
//   title: 'UserProfileNode',
//   category: 'Data Processing',
//   description: 'Processes user profile data',
// })
// export class UserProfileNode extends BaseNode {
//   @PortObject({
//     title: 'User Profile Input',
//     direction: PortDirectionEnum.Input,
//   })
//   userProfile: UserProfile = new UserProfile()
//
//   @PortObject({
//     title: 'Processed User Profile',
//     direction: PortDirectionEnum.Output,
//   })
//   processedProfile: UserProfile = new UserProfile()
//
//   constructor(id: string) {
//     super(id)
//   }
//
//   async execute(context: ExecutionContext): Promise<NodeExecutionResult> {
//     // Example processing logic
//     const postfix = ' (processed)'
//     this.processedProfile.name = this.userProfile.name + postfix
//     this.processedProfile.email = this.userProfile.email + postfix
//     this.processedProfile.age = this.userProfile.age
//
//     // Process nested address
//     if (this.userProfile.address) {
//       const inputAddress = this.userProfile.address
//       const outputAddress = this.processedProfile.address
//
//       outputAddress.street = inputAddress.street + postfix
//       outputAddress.city = inputAddress.city + postfix
//       outputAddress.zipCode = inputAddress.zipCode + postfix
//
//       // Process nested nestedAddress
//       if (inputAddress.nestedAddress) {
//         outputAddress.nestedAddress = new Address()
//         outputAddress.nestedAddress.street = inputAddress.nestedAddress.street + postfix
//         outputAddress.nestedAddress.city = inputAddress.nestedAddress.city + postfix
//         outputAddress.nestedAddress.zipCode = inputAddress.nestedAddress.zipCode + postfix
//       }
//     }
//
//     return {
//       status: 'completed',
//       startTime: context.startTime,
//       endTime: new Date(),
//       outputs: new Map([['processedProfile', this.processedProfile]]),
//     }
//   }
// }

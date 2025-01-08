// import { PortObject, PortString } from '@chaingraph/types'
// import 'reflect-metadata'
//
// @PortObject({ title: 'Address' })
// export class Address {
//   @PortString({ title: 'Street' })
//   street: string = ''
//
//   @PortString({ title: 'City' })
//   city: string = ''
//
//   @PortString({ title: 'Zip Code' })
//   zipCode: string = ''
//
//   @PortObject({
//     title: 'Nested Address',
//   })
//   nestedAddress?: Address = undefined
// }
//
// @PortObject({ title: 'User Profile' })
// export class UserProfile {
//   @PortString({ title: 'Name' })
//   name: string = ''
//
//   @PortString({ title: 'Age' })
//   age: number = 0
//
//   @PortString({ title: 'Email' })
//   email: string = ''
//
//   @PortObject({
//     title: 'Address',
//   })
//   address: Address = new Address()
// }

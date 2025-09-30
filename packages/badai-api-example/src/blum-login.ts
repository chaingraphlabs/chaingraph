/*
 * Copyright (c) 2025 BadLabs
 *
 * Use of this software is governed by the Business Source License 1.1 included in the file LICENSE.txt.
 *
 * As of the Change Date specified in that file, in accordance with the Business Source License, use of this software will be governed by the Apache License, version 2.0.
 */

import process from 'node:process'
import { createGraphQLClient, GraphQL } from '@badaitech/badai-api'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const restApiUrl = process.env.REST_API_URL ?? 'http://localhost:9151/graphql'
const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY ?? ''

async function main() {
  if (!adminPrivateKey) {
    console.error('Please set the ADMIN_PRIVATE_KEY environment variable.')
    process.exit(1)
  }

  // Initialize clients
  const restClient = createGraphQLClient(restApiUrl)

  // 1. Admin flow
  // Generate wallet credentials
  // const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(adminPrivateKey as `0x${string}`)
  console.log('Admin address:', account.address)

  // Authenticate admin
  const { authMetamaskMessage } = await restClient.request(
    GraphQL.AuthMetamaskMessageDocument,
    { address: account.address },
  )

  const signature = await account.signMessage({ message: authMetamaskMessage })

  const { authMetamaskLogin } = await restClient.request(
    GraphQL.AuthMetamaskLoginDocument,
    {
      input: {
        authMessage: authMetamaskMessage,
        sign: signature,
      },
    },
  )

  const adminSession = authMetamaskLogin.session

  // 2. User flow
  // Generate wallet credentials
  const userPrivateKey = generatePrivateKey()
  console.log('User private key (save this!):', userPrivateKey)
  const userAccount = privateKeyToAccount(userPrivateKey)
  const userTelegramID = Math.floor(Math.random() * 1000000) // TODO: Set real Telegram ID here
  console.log('User address:', userAccount.address)

  // Authenticate user, get challenge message
  const { authBlumMetamaskMessage } = await restClient.request(
    GraphQL.AuthBlumMetamaskMessageDocument,
    {
      address: userAccount.address,
      input: {
        telegramID: userTelegramID,
        sign: 'field_for_future_sign',
      },
    },
  )

  // Sign the auth challenge message with the user private key
  const userSignature = await userAccount.signMessage({ message: authBlumMetamaskMessage })

  // Send the signed challenge message to the server to get the auth token (JWT)
  const { authBlumMetamaskLogin } = await restClient.request(
    GraphQL.AuthBlumMetamaskLoginDocument,
    {
      session: adminSession,
      input: {
        authMessage: authBlumMetamaskMessage,
        sign: userSignature,
      },
    },
  )

  const userSession = authBlumMetamaskLogin.session
  console.log('User session (save this!):', userSession)

  const userProfile = authBlumMetamaskLogin.user_profile
  console.log('User profile:', userProfile)

  // Fetch user details to verify JWT session works
  const { userProfile: fetchedUserProfile } = await restClient.request(
    GraphQL.GetUserProfileDocument,
    {
      session: userSession,
    },
  )
  console.log('Fetched user profile:', fetchedUserProfile)
}

main().catch((error) => {
  console.error(error)
})

'use server'

import { revalidatePath } from 'next/cache'
import { keystoneClient } from '../../../dashboard/lib/keystoneClient'

export interface CreateClaimData {
  orderId: string
  type: 'refund' | 'replace'
  claimItems: {
    lineItemId: string
    quantity: number
    reason: 'missing_item' | 'wrong_item' | 'production_failure' | 'other'
    note?: string
    tags?: string[] // Tag IDs
  }[]
  refundAmount?: number
  shippingAddress?: string // Address ID for replacement shipments
  metadata?: any
  noNotification?: boolean
}

export async function createClaimAction(data: CreateClaimData, imageFiles?: FormData) {
  try {
    // Calculate refund amount if not provided and type is refund
    let { refundAmount } = data
    
    if (data.type === 'refund' && !refundAmount) {
      // Query order line items to calculate refund amount
      const orderQuery = `
        query GetOrderLineItems($orderId: ID!) {
          order(where: { id: $orderId }) {
            id
            lineItems {
              id
              title
              quantity
              sku
              thumbnail
              variantTitle
              formattedUnitPrice
              formattedTotal
              variantData
              moneyAmount {
                amount
                originalAmount
                currency {
                  code
                }
              }
            }
          }
        }
      `
      
      const orderResponse = await keystoneClient(orderQuery, { orderId: data.orderId })
      
      if (!orderResponse.success || !orderResponse.data?.order) {
        return {
          success: false,
          error: 'Failed to fetch order data for refund calculation',
          data: null
        }
      }
      
      // Calculate refund based on claim items
      refundAmount = 0
      for (const claimItem of data.claimItems) {
        const lineItem = orderResponse.data.order.lineItems.find(
          (li: any) => li.id === claimItem.lineItemId
        )
        if (lineItem && lineItem.moneyAmount) {
          const unitPrice = lineItem.moneyAmount.amount || 0
          refundAmount += unitPrice * claimItem.quantity
        }
      }
    }

    // Create the claim order
    const createClaimMutation = `
      mutation CreateClaimOrder($data: ClaimOrderCreateInput!) {
        claimOrder: createClaimOrder(data: $data) {
          id
          type
          paymentStatus
          fulfillmentStatus
          refundAmount
          createdAt
          order {
            id
            displayId
          }
        }
      }
    `

    const claimData = {
      type: data.type,
      paymentStatus: data.type === 'refund' ? 'not_refunded' : 'na',
      fulfillmentStatus: 'not_fulfilled',
      refundAmount: refundAmount || 0,
      metadata: data.metadata,
      noNotification: data.noNotification || false,
      order: { connect: { id: data.orderId } },
      ...(data.shippingAddress && {
        address: { connect: { id: data.shippingAddress } }
      })
    }

    const claimResponse = await keystoneClient(createClaimMutation, { data: claimData })
    
    if (!claimResponse.success) {
      return {
        success: false,
        error: claimResponse.error || 'Failed to create claim',
        data: null
      }
    }

    const claimId = claimResponse.data?.claimOrder?.id
    if (!claimId) {
      return {
        success: false,
        error: 'Claim created but ID not returned',
        data: null
      }
    }

    // Create claim items
    const createClaimItemMutation = `
      mutation CreateClaimItem($data: ClaimItemCreateInput!) {
        claimItem: createClaimItem(data: $data) {
          id
          reason
          quantity
          note
        }
      }
    `

    const claimItemPromises = data.claimItems.map(async (item) => {
      const claimItemData = {
        reason: item.reason,
        quantity: item.quantity,
        note: item.note,
        metadata: {
          tags: item.tags || [],
          orderLineItemId: item.lineItemId,
          relationshipSchemaGate: 'ClaimItem.lineItem currently targets cart LineItem'
        },
        claimOrder: { connect: { id: claimId } }
      }

      return keystoneClient(createClaimItemMutation, { data: claimItemData })
    })

    const claimItemResults = await Promise.all(claimItemPromises)
    
    // Check if any claim item creation failed
    const failedItems = claimItemResults.filter(result => !result.success)
    if (failedItems.length > 0) {
      return {
        success: false,
        error: `Failed to create ${failedItems.length} claim items`,
        data: null
      }
    }

    // Create claim images and tags if provided
    const claimImagePromises: Promise<any>[] = []
    const claimTagPromises: Promise<any>[] = []

    for (let i = 0; i < data.claimItems.length; i++) {
      const item = data.claimItems[i]
      const claimItemResult = claimItemResults[i]
      const claimItemId = claimItemResult.data?.claimItem?.id

      if (!claimItemId) continue

      // Store each uploaded photo in the image bucket through the ClaimImage image field
      const files = (imageFiles?.getAll(`image:${item.lineItemId}`) ?? []).filter(
        (file): file is File => typeof file !== 'string' && file.size > 0
      )
      files.forEach(file => {
        claimImagePromises.push(
          keystoneClient(
            `mutation CreateClaimImage($data: ClaimImageCreateInput!) {
              claimImage: createClaimImage(data: $data) { id }
            }`,
            { data: { image: { upload: file }, altText: file.name, claimItem: { connect: { id: claimItemId } } } }
          )
        )
      })

      // Connect existing claim tags
      if (item.tags && item.tags.length > 0) {
        item.tags.forEach(tagId => {
          const connectTagMutation = `
            mutation UpdateClaimItem($id: ID!, $data: ClaimItemUpdateInput!) {
              claimItem: updateClaimItem(where: { id: $id }, data: $data) {
                id
              }
            }
          `
          claimTagPromises.push(
            keystoneClient(connectTagMutation, {
              id: claimItemId,
              data: {
                claimTags: { connect: [{ id: tagId }] }
              }
            })
          )
        })
      }
    }

    // Wait for all image and tag operations to complete
    if (claimImagePromises.length > 0) {
      const imageResults = await Promise.all(claimImagePromises)
      const failedImages = imageResults.filter(r => !r.success)
      if (failedImages.length > 0) {
        return { success: false, error: `Claim created, but ${failedImages.length} photo(s) failed to upload`, data: null }
      }
    }
    if (claimTagPromises.length > 0) {
      await Promise.all(claimTagPromises)
    }

    // Revalidate cache
    revalidatePath(`/dashboard/platform/orders/${data.orderId}`)
    revalidatePath('/dashboard/platform/orders')
    revalidatePath('/dashboard/platform/claims')

    return {
      success: true,
      data: {
        claimOrder: claimResponse.data.claimOrder,
        claimItems: claimItemResults.map(r => r.data?.claimItem).filter(Boolean)
      },
      error: null
    }

  } catch (error) {
    console.error('Create claim error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create claim',
      data: null
    }
  }
}

export async function getClaimTagsAction() {
  try {
    const query = `
      query GetClaimTags {
        claimTags {
          id
          value
          description
          metadata
        }
      }
    `

    const response = await keystoneClient(query, {})
    
    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to fetch claim tags',
        data: []
      }
    }

    return {
      success: true,
      data: response.data?.claimTags || [],
      error: null
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch claim tags',
      data: []
    }
  }
}

export async function updateClaimStatusAction(
  claimId: string, 
  statusType: 'payment' | 'fulfillment',
  status: string
) {
  try {
    const updateField = statusType === 'payment' ? 'paymentStatus' : 'fulfillmentStatus'
    
    const mutation = `
      mutation UpdateClaimStatus($id: ID!, $data: ClaimOrderUpdateInput!) {
        claimOrder: updateClaimOrder(where: { id: $id }, data: $data) {
          id
          paymentStatus
          fulfillmentStatus
          updatedAt
        }
      }
    `

    const response = await keystoneClient(mutation, {
      id: claimId,
      data: { [updateField]: status }
    })

    if (!response.success) {
      return {
        success: false,
        error: response.error || 'Failed to update claim status',
        data: null
      }
    }

    // Revalidate cache
    revalidatePath('/dashboard/platform/claims')
    revalidatePath('/dashboard/platform/orders')

    return {
      success: true,
      data: response.data?.claimOrder,
      error: null
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update claim status',
      data: null
    }
  }
}

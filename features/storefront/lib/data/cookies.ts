import "server-only"
import { cookies } from "next/headers"
import {
  cartIdFromProof,
  verifyCartProof,
} from "@/features/keystone/security/token-crypto"

export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies()
  const token = cookieStore.get("keystonejs-session")?.value
  const cartProof = cookieStore.get("_openfront_cart_id")?.value
  const headers: Record<string, string> = {}

  if (token) headers.authorization = `Bearer ${token}`
  if (cartProof) headers["x-openfront-cart-proof"] = cartProof

  return headers
}

export const setAuthToken = async (token: string) => {
  if (!token || token.length > 16_384) throw new Error("Invalid session token")
  ;(await cookies()).set("keystonejs-session", token, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

export const removeAuthToken = async () => {
  ;(await cookies()).set("keystonejs-session", "", {
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

export const getCartId = async (): Promise<string | undefined> => {
  const proof = (await cookies()).get("_openfront_cart_id")?.value
  const cartId = cartIdFromProof(proof)
  return cartId && verifyCartProof(proof, cartId) ? cartId : undefined
}

// This server-only helper accepts an already issued proof. It never mints one;
// only the constrained Keystone cart commands have signing authority.
export const setCartProof = async (proof: string) => {
  const cartId = cartIdFromProof(proof)
  if (!cartId || !verifyCartProof(proof, cartId)) throw new Error("Invalid cart proof")
  ;(await cookies()).set("_openfront_cart_id", proof, {
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

export const removeCartId = async () => {
  ;(await cookies()).set("_openfront_cart_id", "", {
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

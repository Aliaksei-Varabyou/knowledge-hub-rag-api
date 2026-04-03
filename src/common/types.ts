import { UserRole } from "./enums"

export type User = {
  id: string,
  login: string
  password: string,
  role: UserRole,
  createdAt: number,
  updatedAt: number
}

export type Category = {
  id: string,
  name: string
  description: string
}

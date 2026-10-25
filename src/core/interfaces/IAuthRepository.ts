import { SingleResponseType } from '@/type/IApiResponse'

export interface IAuthRepository {
  signIn(email: string, password: string): Promise<SingleResponseType<any>>
  signUp(
    email: string,
    password: string,
    data: any
  ): Promise<SingleResponseType<any>>
  signOut(): Promise<void>
  getCurrentUser(): Promise<SingleResponseType<any>>
}

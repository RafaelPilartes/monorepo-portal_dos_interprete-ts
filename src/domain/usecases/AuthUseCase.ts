import { ApiRepository } from '@/modules/Api'
import { SingleResponseType } from '@/type/IApiResponse'

export class AuthUseCase {
  private repository = ApiRepository.auth

  async executeSignIn(
    email: string,
    password: string
  ): Promise<SingleResponseType<any>> {
    return this.repository.signIn(email, password)
  }

  async executeSignUp(
    email: string,
    password: string,
    data: any
  ): Promise<SingleResponseType<any>> {
    return this.repository.signUp(email, password, data)
  }

  async executeSignOut(): Promise<void> {
    return this.repository.signOut()
  }

  async executeGetCurrentUser(): Promise<SingleResponseType<any>> {
    return this.repository.getCurrentUser()
  }
}

export const authUseCase = new AuthUseCase()

import { supabase } from '@/config/supabase'
import { IAuthRepository } from '@/core/interfaces/IAuthRepository'
import { SingleResponseType } from '@/type/IApiResponse'

export class SupabaseAuthDAO implements IAuthRepository {
  async signIn(
    email: string,
    password: string
  ): Promise<SingleResponseType<any>> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      throw new Error(error.message)
    }

    return { data: data.user }
  }

  async signUp(
    email: string,
    password: string,
    extraData: any
  ): Promise<SingleResponseType<any>> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: extraData
      }
    })

    if (error) {
      throw new Error(error.message)
    }

    return { data: data.user }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  }

  async getCurrentUser(): Promise<SingleResponseType<any>> {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error) {
      throw new Error(error.message)
    }

    return { data: user }
  }
}

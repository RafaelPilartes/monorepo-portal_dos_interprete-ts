import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authUseCase } from '@/domain/usecases/AuthUseCase'
import { toast } from 'sonner'

export const AUTH_KEYS = {
  user: ['auth', 'user'] as const
}

export const useAuthViewModel = () => {
  const queryClient = useQueryClient()

  const useCurrentUser = () => {
    return useQuery({
      queryKey: AUTH_KEYS.user,
      queryFn: async () => {
        const response = await authUseCase.executeGetCurrentUser()
        return response.data
      }
    })
  }

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: any) =>
      authUseCase.executeSignIn(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEYS.user })
      toast.success('Login realizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao fazer login: ${error.message}`)
    }
  })

  const registerMutation = useMutation({
    mutationFn: ({ email, password, data }: any) =>
      authUseCase.executeSignUp(email, password, data),
    onSuccess: () => {
      toast.success('Cadastro realizado com sucesso. Verifique seu e-mail.')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`)
    }
  })

  const logoutMutation = useMutation({
    mutationFn: () => authUseCase.executeSignOut(),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_KEYS.user, null)
      toast.success('Logout realizado com sucesso')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao fazer logout: ${error.message}`)
    }
  })

  return {
    useCurrentUser,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending
  }
}

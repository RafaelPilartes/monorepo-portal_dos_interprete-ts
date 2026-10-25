import { TestimonialEntity } from '@/core/entities/content/TestimonialEntity'
import { ITestimonialRepository } from '@/core/interfaces/ITestimonialRepository'
import { BaseSupabaseDAO } from './BaseSupabaseDAO'

export class SupabaseTestimonialDAO
  extends BaseSupabaseDAO<TestimonialEntity>
  implements ITestimonialRepository
{
  constructor() {
    super(
      'testimonials',
      ['author_name', 'content'],
      '*, author_user:users(*), approved_by_user:users(*)'
    )
  }

  protected mapToEntity(data: any): TestimonialEntity {
    return new TestimonialEntity({
      ...data,
      author_user: data.author_user ? data.author_user : undefined,
      approved_by_user: data.approved_by_user ? data.approved_by_user : undefined,
      approved_at: data.approved_at ? new Date(data.approved_at) : undefined,
      created_at: data.created_at ? new Date(data.created_at) : undefined,
      updated_at: data.updated_at ? new Date(data.updated_at) : undefined
    })
  }
}

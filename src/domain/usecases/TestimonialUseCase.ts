import { TestimonialEntity } from '@/core/entities/content/TestimonialEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class TestimonialUseCase {
  async getTestimonialById(id: string): Promise<TestimonialEntity | null> {
    try {
      return await ApiRepository.testimonial.getById(id)
    } catch (error) {
      console.error('Error fetching testimonial:', error)
      throw error
    }
  }

  async getAllTestimonials(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<TestimonialEntity[]>> {
    try {
      return await ApiRepository.testimonial.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      throw error
    }
  }

  async updateTestimonial(
    id: string,
    data: Partial<TestimonialEntity>
  ): Promise<TestimonialEntity> {
    try {
      return await ApiRepository.testimonial.update(id, data)
    } catch (error) {
      console.error('Error updating testimonial:', error)
      throw error
    }
  }
}

export const testimonialUseCase = new TestimonialUseCase()

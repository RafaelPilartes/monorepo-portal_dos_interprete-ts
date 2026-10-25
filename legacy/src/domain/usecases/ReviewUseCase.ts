import { ReviewEntity } from '@/core/entities/booking/ReviewEntity'
import { ApiRepository } from '@/modules/Api'
import { ListResponseType } from '@/type/IApiResponse'

export class ReviewUseCase {
  async getReviewById(id: string): Promise<ReviewEntity | null> {
    try {
      return await ApiRepository.review.getById(id)
    } catch (error) {
      console.error('Error fetching review:', error)
      throw error
    }
  }

  async getAllReviews(
    limit?: number,
    offset?: number,
    searchTerm?: string
  ): Promise<ListResponseType<ReviewEntity[]>> {
    try {
      return await ApiRepository.review.getAll(limit, offset, searchTerm)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      throw error
    }
  }

  async getReviewsByInterpreterId(
    interpreterId: string,
    limit?: number,
    offset?: number
  ): Promise<ListResponseType<ReviewEntity[]>> {
    try {
      return await ApiRepository.review.getAllByField(
        'target_interpreter_id',
        interpreterId,
        limit,
        offset
      )
    } catch (error) {
      console.error('Error fetching reviews for interpreter:', error)
      throw error
    }
  }

  async updateReview(
    id: string,
    data: Partial<ReviewEntity>
  ): Promise<ReviewEntity> {
    try {
      return await ApiRepository.review.update(id, data)
    } catch (error) {
      console.error('Error updating review:', error)
      throw error
    }
  }
}

export const reviewUseCase = new ReviewUseCase()

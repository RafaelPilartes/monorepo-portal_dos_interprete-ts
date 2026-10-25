import { IAuthRepository } from '@/core/interfaces/IAuthRepository'
import { IUserRepository } from '@/core/interfaces/IUserRepository'
import { IAdminProfileRepository } from '@/core/interfaces/IAdminProfileRepository'
import { IInterpreterProfileRepository } from '@/core/interfaces/IInterpreterProfileRepository'
import { IRequesterProfileRepository } from '@/core/interfaces/IRequesterProfileRepository'
import { IInterpreterAvailabilityRepository } from '@/core/interfaces/IInterpreterAvailabilityRepository'
import { IInterpreterCertificationRepository } from '@/core/interfaces/IInterpreterCertificationRepository'
import { IInterpreterEducationRepository } from '@/core/interfaces/IInterpreterEducationRepository'
import { IInterpreterExperienceRepository } from '@/core/interfaces/IInterpreterExperienceRepository'
import { IInterpreterPortfolioRepository } from '@/core/interfaces/IInterpreterPortfolioRepository'
import { IInterpreterServiceRepository } from '@/core/interfaces/IInterpreterServiceRepository'
import { IBookingRepository } from '@/core/interfaces/IBookingRepository'
import { IBookingLogRepository } from '@/core/interfaces/IBookingLogRepository'
import { IChatMessageRepository } from '@/core/interfaces/IChatMessageRepository'
import { IFavoriteRepository } from '@/core/interfaces/IFavoriteRepository'
import { IReviewRepository } from '@/core/interfaces/IReviewRepository'
import { IServiceRepository } from '@/core/interfaces/IServiceRepository'
import { IStorageRepository } from '@/core/interfaces/IStorageRepository'

// New Domain Interfaces
import { IArticleRepository } from '@/core/interfaces/IArticleRepository'
import { IEventRepository } from '@/core/interfaces/IEventRepository'
import { IForumPostRepository } from '@/core/interfaces/IForumPostRepository'
import { IForumTopicRepository } from '@/core/interfaces/IForumTopicRepository'
import { ISuccessCaseRepository } from '@/core/interfaces/ISuccessCaseRepository'
import { ITestimonialRepository } from '@/core/interfaces/ITestimonialRepository'

import { IPaymentRepository } from '@/core/interfaces/IPaymentRepository'
import { IPayoutRepository } from '@/core/interfaces/IPayoutRepository'

import { ILanguageRepository } from '@/core/interfaces/ILanguageRepository'
import { IOpportunityRepository } from '@/core/interfaces/IOpportunityRepository'
import { IPartnershipRepository } from '@/core/interfaces/IPartnershipRepository'
import { ISpecialtyRepository } from '@/core/interfaces/ISpecialtyRepository'

import { IAuditLogRepository } from '@/core/interfaces/IAuditLogRepository'
import { IDocumentRepository } from '@/core/interfaces/IDocumentRepository'
import { ILegalResourceRepository } from '@/core/interfaces/ILegalResourceRepository'
import { INotificationRepository } from '@/core/interfaces/INotificationRepository'
import { ISupportTicketRepository } from '@/core/interfaces/ISupportTicketRepository'
import { ISystemConfigRepository } from '@/core/interfaces/ISystemConfigRepository'
import { IVerificationRequestRepository } from '@/core/interfaces/IVerificationRequestRepository'

// Supabase DAOs
import { SupabaseAuthDAO } from './supabase/SupabaseAuthDAO'
import { SupabaseUserDAO } from './supabase/SupabaseUserDAO'
import { SupabaseAdminProfileDAO } from './supabase/SupabaseAdminProfileDAO'
import { SupabaseInterpreterProfileDAO } from './supabase/SupabaseInterpreterProfileDAO'
import { SupabaseRequesterProfileDAO } from './supabase/SupabaseRequesterProfileDAO'
import { SupabaseInterpreterAvailabilityDAO } from './supabase/SupabaseInterpreterAvailabilityDAO'
import { SupabaseInterpreterCertificationDAO } from './supabase/SupabaseInterpreterCertificationDAO'
import { SupabaseInterpreterEducationDAO } from './supabase/SupabaseInterpreterEducationDAO'
import { SupabaseInterpreterExperienceDAO } from './supabase/SupabaseInterpreterExperienceDAO'
import { SupabaseInterpreterPortfolioDAO } from './supabase/SupabaseInterpreterPortfolioDAO'
import { SupabaseInterpreterServiceDAO } from './supabase/SupabaseInterpreterServiceDAO'
import { SupabaseBookingDAO } from './supabase/SupabaseBookingDAO'
import { SupabaseBookingLogDAO } from './supabase/SupabaseBookingLogDAO'
import { SupabaseChatMessageDAO } from './supabase/SupabaseChatMessageDAO'
import { SupabaseFavoriteDAO } from './supabase/SupabaseFavoriteDAO'
import { SupabaseReviewDAO } from './supabase/SupabaseReviewDAO'
import { SupabaseServiceDAO } from './supabase/SupabaseServiceDAO'
import { SupabaseStorageDAO } from './supabase/SupabaseStorageDAO'

// New Domain DAOs
import { SupabaseArticleDAO } from './supabase/SupabaseArticleDAO'
import { SupabaseEventDAO } from './supabase/SupabaseEventDAO'
import { SupabaseForumPostDAO } from './supabase/SupabaseForumPostDAO'
import { SupabaseForumTopicDAO } from './supabase/SupabaseForumTopicDAO'
import { SupabaseSuccessCaseDAO } from './supabase/SupabaseSuccessCaseDAO'
import { SupabaseTestimonialDAO } from './supabase/SupabaseTestimonialDAO'

import { SupabasePaymentDAO } from './supabase/SupabasePaymentDAO'
import { SupabasePayoutDAO } from './supabase/SupabasePayoutDAO'

import { SupabaseLanguageDAO } from './supabase/SupabaseLanguageDAO'
import { SupabaseOpportunityDAO } from './supabase/SupabaseOpportunityDAO'
import { SupabasePartnershipDAO } from './supabase/SupabasePartnershipDAO'
import { SupabaseSpecialtyDAO } from './supabase/SupabaseSpecialtyDAO'

import { SupabaseAuditLogDAO } from './supabase/SupabaseAuditLogDAO'
import { SupabaseDocumentDAO } from './supabase/SupabaseDocumentDAO'
import { SupabaseLegalResourceDAO } from './supabase/SupabaseLegalResourceDAO'
import { SupabaseNotificationDAO } from './supabase/SupabaseNotificationDAO'
import { SupabaseSupportTicketDAO } from './supabase/SupabaseSupportTicketDAO'
import { SupabaseSystemConfigDAO } from './supabase/SupabaseSystemConfigDAO'
import { SupabaseVerificationRequestDAO } from './supabase/SupabaseVerificationRequestDAO'

export type ApiDriverType = 'supabase' | 'rest' | 'firebase'

class ApiFactory {
  private driver: ApiDriverType = 'supabase'

  setDriver(driver: ApiDriverType) {
    this.driver = driver
  }

  // Auth
  get auth(): IAuthRepository { return new SupabaseAuthDAO() }

  // Users
  get user(): IUserRepository { return new SupabaseUserDAO() }

  // Identity Profiles
  get adminProfiles(): IAdminProfileRepository { return new SupabaseAdminProfileDAO() }
  get interpreterProfile(): IInterpreterProfileRepository { return new SupabaseInterpreterProfileDAO() }
  get requesterProfile(): IRequesterProfileRepository { return new SupabaseRequesterProfileDAO() }

  // Interpreter Details
  get interpreterAvailability(): IInterpreterAvailabilityRepository { return new SupabaseInterpreterAvailabilityDAO() }
  get interpreterCertification(): IInterpreterCertificationRepository { return new SupabaseInterpreterCertificationDAO() }
  get interpreterEducation(): IInterpreterEducationRepository { return new SupabaseInterpreterEducationDAO() }
  get interpreterExperience(): IInterpreterExperienceRepository { return new SupabaseInterpreterExperienceDAO() }
  get interpreterPortfolio(): IInterpreterPortfolioRepository { return new SupabaseInterpreterPortfolioDAO() }
  get interpreterService(): IInterpreterServiceRepository { return new SupabaseInterpreterServiceDAO() }

  // Booking
  get booking(): IBookingRepository { return new SupabaseBookingDAO() }
  get bookingLog(): IBookingLogRepository { return new SupabaseBookingLogDAO() }
  get chatMessage(): IChatMessageRepository { return new SupabaseChatMessageDAO() }
  get favorite(): IFavoriteRepository { return new SupabaseFavoriteDAO() }
  get review(): IReviewRepository { return new SupabaseReviewDAO() }
  get service(): IServiceRepository { return new SupabaseServiceDAO() }

  // Content
  get article(): IArticleRepository { return new SupabaseArticleDAO() }
  get event(): IEventRepository { return new SupabaseEventDAO() }
  get forumPost(): IForumPostRepository { return new SupabaseForumPostDAO() }
  get forumTopic(): IForumTopicRepository { return new SupabaseForumTopicDAO() }
  get successCase(): ISuccessCaseRepository { return new SupabaseSuccessCaseDAO() }
  get testimonial(): ITestimonialRepository { return new SupabaseTestimonialDAO() }

  // Financial
  get payment(): IPaymentRepository { return new SupabasePaymentDAO() }
  get payout(): IPayoutRepository { return new SupabasePayoutDAO() }

  // Platform
  get language(): ILanguageRepository { return new SupabaseLanguageDAO() }
  get opportunity(): IOpportunityRepository { return new SupabaseOpportunityDAO() }
  get partnership(): IPartnershipRepository { return new SupabasePartnershipDAO() }
  get specialty(): ISpecialtyRepository { return new SupabaseSpecialtyDAO() }

  // System
  get auditLog(): IAuditLogRepository { return new SupabaseAuditLogDAO() }
  get document(): IDocumentRepository { return new SupabaseDocumentDAO() }
  get legalResource(): ILegalResourceRepository { return new SupabaseLegalResourceDAO() }
  get notification(): INotificationRepository { return new SupabaseNotificationDAO() }
  get supportTicket(): ISupportTicketRepository { return new SupabaseSupportTicketDAO() }
  get systemConfig(): ISystemConfigRepository { return new SupabaseSystemConfigDAO() }
  get verificationRequest(): IVerificationRequestRepository { return new SupabaseVerificationRequestDAO() }

  // Storage
  get storage(): IStorageRepository { return new SupabaseStorageDAO() }
}

export const ApiRepository = new ApiFactory()

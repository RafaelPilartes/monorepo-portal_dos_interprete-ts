import { ArticleStatus, EventType, EventStatus, TopicCategory, TestimonialStatus } from '@/type/enum'

export interface ArticleProps {
  id: string
  title: string
  slug: string
  summary: string
  content: string

  cover_image_url?: string
  tags?: string[]

  status: ArticleStatus
  author_id: string
  author_name?: string

  published_at?: Date
  view_count?: number

  created_at?: Date
  updated_at?: Date
}

export interface EventProps {
  id: string
  title: string
  description: string

  type: EventType
  status: EventStatus

  start_date: Date
  end_date: Date

  location?: string
  meeting_link?: string

  capacity?: number
  registered_count?: number

  cover_image_url?: string
  tags?: string[]

  organizer_id: string
  created_at?: Date
  updated_at?: Date
}

export interface ForumTopicProps {
  id: string
  author_id: string
  title: string
  category: TopicCategory

  is_pinned: boolean
  is_locked: boolean
  post_count: number
  view_count: number

  last_post_at?: Date
  created_at?: Date
  updated_at?: Date
}

export interface ForumPostProps {
  id: string
  topic_id: string
  author_id: string

  content: string
  parent_post_id?: string

  is_solution: boolean
  like_count: number

  created_at?: Date
  updated_at?: Date
}

export interface SuccessCaseProps {
  id: string
  title: string
  summary: string
  content: string

  cover_image_url?: string
  gallery_urls?: string[]

  interpreter_id?: string
  requester_id?: string
  booking_id?: string

  tags?: string[]
  is_published: boolean
  published_at?: Date

  author_user_id: string
  created_at?: Date
  updated_at?: Date
}

export interface TestimonialProps {
  id: string
  author_name: string
  author_role?: string
  author_avatar_url?: string
  author_user_id?: string

  content: string
  rating?: number

  status: TestimonialStatus
  is_featured: boolean

  approved_by_user_id?: string
  approved_at?: Date

  created_at?: Date
  updated_at?: Date
}

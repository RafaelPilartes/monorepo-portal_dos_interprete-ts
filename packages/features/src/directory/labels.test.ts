import { describe, expect, it } from 'vitest'
import { videoEmbedUrl } from './labels'

describe('videoEmbedUrl (R-DIR-07)', () => {
  it('embeds YouTube and Vimeo links', () => {
    expect(videoEmbedUrl('https://www.youtube.com/watch?v=ScMzIvxBSi4')).toBe('https://www.youtube.com/embed/ScMzIvxBSi4?rel=0')
    expect(videoEmbedUrl('https://youtu.be/ScMzIvxBSi4')).toBe('https://www.youtube.com/embed/ScMzIvxBSi4?rel=0')
    expect(videoEmbedUrl('https://vimeo.com/76979871')).toBe('https://player.vimeo.com/video/76979871')
  })

  it('keeps any other link as a plain link', () => {
    expect(videoEmbedUrl('https://exemplo.ao/video.mp4')).toBeNull()
  })
})

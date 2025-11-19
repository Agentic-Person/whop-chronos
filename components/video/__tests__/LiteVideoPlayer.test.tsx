import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LiteVideoPlayer from '../LiteVideoPlayer';

// Mock react-lite-youtube-embed
vi.mock('react-lite-youtube-embed', () => ({
  default: ({ id, title }: { id: string; title: string }) => (
    <div data-testid="lite-youtube" data-video-id={id} aria-label={title}>
      YouTube Lite Player: {id}
    </div>
  ),
}));

describe('LiteVideoPlayer Component', () => {
  describe('YouTube Videos', () => {
    it('should render YouTube video player', () => {
      const video = {
        id: 'video-123',
        source_type: 'youtube' as const,
        youtube_video_id: 'dQw4w9WgXcQ',
        title: 'Test Video',
        url: null,
        storage_path: null,
        thumbnail_url: null,
      } as any;

      render(<LiteVideoPlayer video={video} />);

      const player = screen.getByTestId('lite-youtube');
      expect(player).toBeInTheDocument();
      expect(player).toHaveAttribute('data-video-id', 'dQw4w9WgXcQ');
    });

    it('should display error when YouTube video ID is missing', () => {
      const video = {
        id: 'video-123',
        source_type: 'youtube' as const,
        youtube_video_id: null,
        title: 'Test Video',
      } as any;

      render(<LiteVideoPlayer video={video} />);

      expect(screen.getByText(/YouTube video ID not found/i)).toBeInTheDocument();
      expect(screen.getByText(/Video ID: video-123/i)).toBeInTheDocument();
    });

    it('should use video title for YouTube player', () => {
      const video = {
        id: 'video-123',
        source_type: 'youtube' as const,
        youtube_video_id: 'dQw4w9WgXcQ',
        title: 'My Custom Title',
      } as any;

      render(<LiteVideoPlayer video={video} />);

      const player = screen.getByLabelText('My Custom Title');
      expect(player).toBeInTheDocument();
    });
  });

  describe('Uploaded Videos', () => {
    it('should render native video player for uploaded videos', () => {
      const video = {
        id: 'video-456',
        source_type: 'upload' as const,
        url: 'https://example.com/video.mp4',
        title: 'Uploaded Video',
      } as any;

      render(<LiteVideoPlayer video={video} />);

      const videoElement = screen.getByRole('application');
      expect(videoElement).toBeInTheDocument();
      expect(videoElement.tagName).toBe('VIDEO');
      expect(videoElement).toHaveAttribute('src', 'https://example.com/video.mp4');
    });

    it('should use storage_path if url is not available', () => {
      const video = {
        id: 'video-456',
        source_type: 'upload' as const,
        url: null,
        storage_path: '/storage/videos/test.mp4',
        title: 'Uploaded Video',
      } as any;

      render(<LiteVideoPlayer video={video} />);

      const videoElement = screen.getByRole('application');
      expect(videoElement).toHaveAttribute('src', '/storage/videos/test.mp4');
    });

    it('should display error when no video source is available', () => {
      const video = {
        id: 'video-789',
        source_type: 'upload' as const,
        url: null,
        storage_path: null,
        title: 'Missing Source',
      } as any;

      render(<LiteVideoPlayer video={video} />);

      expect(screen.getByText(/No video source available/i)).toBeInTheDocument();
      expect(screen.getByText(/Video ID: video-789/i)).toBeInTheDocument();
    });

    it('should include video controls', () => {
      const video = {
        id: 'video-456',
        source_type: 'upload' as const,
        url: 'https://example.com/video.mp4',
        title: 'Test Video',
      } as any;

      render(<LiteVideoPlayer video={video} />);

      const videoElement = screen.getByRole('application');
      expect(videoElement).toHaveAttribute('controls');
    });

    it('should use thumbnail if available', () => {
      const video = {
        id: 'video-456',
        source_type: 'upload' as const,
        url: 'https://example.com/video.mp4',
        title: 'Test Video',
        thumbnail_url: 'https://example.com/thumbnail.jpg',
      } as any;

      render(<LiteVideoPlayer video={video} />);

      const videoElement = screen.getByRole('application');
      expect(videoElement).toHaveAttribute('poster', 'https://example.com/thumbnail.jpg');
    });

    it('should not have poster attribute if thumbnail is missing', () => {
      const video = {
        id: 'video-456',
        source_type: 'upload' as const,
        url: 'https://example.com/video.mp4',
        title: 'Test Video',
        thumbnail_url: null,
      } as any;

      render(<LiteVideoPlayer video={video} />);

      const videoElement = screen.getByRole('application');
      expect(videoElement).not.toHaveAttribute('poster');
    });
  });

  describe('Styling and Layout', () => {
    it('should apply custom className', () => {
      const video = {
        id: 'video-123',
        source_type: 'youtube' as const,
        youtube_video_id: 'dQw4w9WgXcQ',
        title: 'Test Video',
      } as any;

      const { container } = render(
        <LiteVideoPlayer video={video} className="custom-class" />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class');
    });

    it('should have responsive aspect ratio', () => {
      const video = {
        id: 'video-456',
        source_type: 'upload' as const,
        url: 'https://example.com/video.mp4',
        title: 'Test Video',
      } as any;

      const { container } = render(<LiteVideoPlayer video={video} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('aspect-video');
    });
  });

  describe('Error Handling', () => {
    it('should display fallback text for browsers without video support', () => {
      const video = {
        id: 'video-456',
        source_type: 'upload' as const,
        url: 'https://example.com/video.mp4',
        title: 'Test Video',
      } as any;

      render(<LiteVideoPlayer video={video} />);

      expect(
        screen.getByText(/Your browser does not support the video tag/i)
      ).toBeInTheDocument();
    });
  });

  describe('Video Metadata', () => {
    it('should set preload attribute to metadata', () => {
      const video = {
        id: 'video-456',
        source_type: 'upload' as const,
        url: 'https://example.com/video.mp4',
        title: 'Test Video',
      } as any;

      render(<LiteVideoPlayer video={video} />);

      const videoElement = screen.getByRole('application');
      expect(videoElement).toHaveAttribute('preload', 'metadata');
    });
  });
});

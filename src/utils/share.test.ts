import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { shareRecipe } from './share';

describe('shareRecipe', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Reset window.location
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).location;
    window.location = { origin: 'http://localhost:3000', pathname: '/' } as Location;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockRecipe = {
    id: 1,
    name: 'Test Smoothie',
    contributor: 'Test User',
    emoji: '🥤',
  };

  it('should use Web Share API when available', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockCanShare = vi.fn().mockReturnValue(true);
    
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: mockShare,
    });
    Object.defineProperty(navigator, 'canShare', {
      writable: true,
      value: mockCanShare,
    });

    const result = await shareRecipe(mockRecipe);

    expect(result).toBe(true);
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Test Smoothie - Smoothie Recipe',
      text: 'Check out this smoothie recipe: Test Smoothie 🥤 by Test User',
      url: 'http://localhost:3000/?recipe=1',
    });
  });

  it('should fallback to clipboard when Web Share API is not available', async () => {
    // Remove navigator.share
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: mockWriteText,
      },
    });

    const result = await shareRecipe(mockRecipe);

    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith('http://localhost:3000/?recipe=1');
  });

  it('should fallback to clipboard when canShare returns false', async () => {
    const mockShare = vi.fn();
    const mockCanShare = vi.fn().mockReturnValue(false);
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: mockShare,
    });
    Object.defineProperty(navigator, 'canShare', {
      writable: true,
      value: mockCanShare,
    });
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: mockWriteText,
      },
    });

    const result = await shareRecipe(mockRecipe);

    expect(result).toBe(true);
    expect(mockShare).not.toHaveBeenCalled();
    expect(mockWriteText).toHaveBeenCalledWith('http://localhost:3000/?recipe=1');
  });

  it('should return false when user cancels Web Share', async () => {
    const abortError = new Error('User cancelled');
    abortError.name = 'AbortError';
    const mockShare = vi.fn().mockRejectedValue(abortError);
    const mockCanShare = vi.fn().mockReturnValue(true);
    
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: mockShare,
    });
    Object.defineProperty(navigator, 'canShare', {
      writable: true,
      value: mockCanShare,
    });

    const result = await shareRecipe(mockRecipe);

    expect(result).toBe(false);
  });

  it('should fallback to clipboard when Web Share throws non-abort error', async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error('Share failed'));
    const mockCanShare = vi.fn().mockReturnValue(true);
    const mockWriteText = vi.fn().mockResolvedValue(undefined);
    
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: mockShare,
    });
    Object.defineProperty(navigator, 'canShare', {
      writable: true,
      value: mockCanShare,
    });
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: mockWriteText,
      },
    });

    const result = await shareRecipe(mockRecipe);

    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalled();
  });

  it('should use execCommand fallback when clipboard API fails', async () => {
    // Remove navigator.share
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard failed'));
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: mockWriteText,
      },
    });

    const mockExecCommand = vi.fn().mockReturnValue(true);
    document.execCommand = mockExecCommand;

    const result = await shareRecipe(mockRecipe);

    expect(result).toBe(true);
    expect(mockExecCommand).toHaveBeenCalledWith('copy');
  });

  it('should return false when all sharing methods fail', async () => {
    // Remove navigator.share
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined,
    });

    const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard failed'));
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: {
        writeText: mockWriteText,
      },
    });

    // Mock execCommand to throw an error
    const originalExecCommand = document.execCommand;
    document.execCommand = vi.fn().mockImplementation(() => {
      throw new Error('execCommand failed');
    });

    const result = await shareRecipe(mockRecipe);

    expect(result).toBe(false);
    
    // Restore
    document.execCommand = originalExecCommand;
  });
});


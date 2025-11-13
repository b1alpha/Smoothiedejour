export interface ShareOptions {
  title: string;
  text: string;
  url: string;
}

/**
 * Share a recipe using Web Share API if available, otherwise fallback to copy link
 */
export async function shareRecipe(recipe: { id: number | string; name: string; contributor: string; emoji: string }): Promise<boolean> {
  const shareUrl = `${window.location.origin}${window.location.pathname}?recipe=${recipe.id}`;
  const shareText = `Check out this smoothie recipe: ${recipe.name} ${recipe.emoji} by ${recipe.contributor}`;
  
  const shareData: ShareOptions = {
    title: `${recipe.name} - Smoothie Recipe`,
    text: shareText,
    url: shareUrl,
  };

  // Check if Web Share API is available (mobile browsers)
  if (navigator.share) {
    try {
      // Check if canShare is available and if the data can be shared
      if (navigator.canShare && !navigator.canShare(shareData)) {
        // Can't share this data, fall through to clipboard
      } else {
        await navigator.share(shareData);
        return true;
      }
    } catch (error) {
      // User cancelled or error occurred
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      if (!isAbortError) {
        console.error('Error sharing:', error);
      }
      // If user cancelled, don't fall back to clipboard
      if (isAbortError) {
        return false;
      }
      // Otherwise, fall through to clipboard fallback
    }
  }
  
  // Fallback: Copy to clipboard
  try {
    await navigator.clipboard.writeText(shareUrl);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    // Last resort: select text
    const textArea = document.createElement('textarea');
    textArea.value = shareUrl;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}


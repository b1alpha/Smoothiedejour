export interface ShareOptions {
  title: string;
  text: string;
  url: string;
}

/**
 * Share a recipe using Web Share API if available, otherwise fallback to copy link
 */
export async function shareRecipe(recipe: { id: number | string; name: string; contributor: string; emoji: string }): Promise<boolean> {
  // URL encode the recipe ID to handle special characters like colons in community recipe IDs
  const encodedRecipeId = encodeURIComponent(String(recipe.id));
  const shareUrl = `${window.location.origin}${window.location.pathname}?recipe=${encodedRecipeId}`;
  const shareText = `Check out this smoothie recipe: ${recipe.name} ${recipe.emoji} by ${recipe.contributor}`;
  
  // Try sharing with text-only first (includes URL in text for apps like Signal)
  // Some apps prioritize url field and ignore text when both are present
  const textOnlyData = {
    title: `${recipe.name} - Smoothie Recipe`,
    text: `${shareText}\n${shareUrl}`,
  };
  
  // Full share data with both text and url for apps that support it
  const shareData: ShareOptions = {
    title: `${recipe.name} - Smoothie Recipe`,
    text: shareText,
    url: shareUrl,
  };

  // Check if Web Share API is available (mobile browsers)
  if (navigator.share) {
    try {
      // Try text-only first (better for Signal and similar apps that ignore text when url is present)
      // Check if canShare is available and supports text-only
      const canShareTextOnly = !navigator.canShare || navigator.canShare(textOnlyData);
      
      if (canShareTextOnly) {
        try {
          await navigator.share(textOnlyData);
          return true;
        } catch (textOnlyError) {
          // If text-only fails and it's not a user cancellation, try full share data
          const isAbortError = textOnlyError instanceof Error && textOnlyError.name === 'AbortError';
          if (isAbortError) {
            return false;
          }
          // Fall through to try full share data
        }
      }
      
      // Fall back to full share data if text-only didn't work
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      }
      // If neither works, fall through to clipboard
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
  
  // Fallback: Copy to clipboard (include text + URL)
  const clipboardText = `${shareText}\n${shareUrl}`;
  try {
    await navigator.clipboard.writeText(clipboardText);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    // Last resort: select text
    const textArea = document.createElement('textarea');
    textArea.value = clipboardText;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
}


import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterToggles } from './FilterToggles';

describe('FilterToggles', () => {
  const mockOnNoFatChange = vi.fn();
  const mockOnNoNutsChange = vi.fn();
  const mockOnFavoritesOnlyChange = vi.fn();

  const defaultProps = {
    noFat: false,
    noNuts: false,
    favoritesOnly: false,
    onNoFatChange: mockOnNoFatChange,
    onNoNutsChange: mockOnNoNutsChange,
    onFavoritesOnlyChange: mockOnFavoritesOnlyChange,
    filteredCount: 10,
    totalCount: 15,
    favoritesCount: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all filter toggles', () => {
    render(<FilterToggles {...defaultProps} />);

    expect(screen.getByLabelText('No Fat')).toBeInTheDocument();
    expect(screen.getByLabelText('No Nuts')).toBeInTheDocument();
    expect(screen.getByLabelText(/Favorites Only/i)).toBeInTheDocument();
  });

  it('should display recipe count', () => {
    render(<FilterToggles {...defaultProps} />);

    expect(screen.getByText(/10 of 15 recipes available/i)).toBeInTheDocument();
    expect(screen.getByText(/3 favorites/i)).toBeInTheDocument();
  });

  it('should display singular favorite when count is 1', () => {
    render(<FilterToggles {...defaultProps} favoritesCount={1} />);

    expect(screen.getByText(/1 favorite/)).toBeInTheDocument();
  });

  it('should call onNoFatChange when No Fat toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterToggles {...defaultProps} />);

    const noFatToggle = screen.getByLabelText('No Fat');
    await user.click(noFatToggle);

    expect(mockOnNoFatChange).toHaveBeenCalledWith(true);
  });

  it('should call onNoNutsChange when No Nuts toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterToggles {...defaultProps} />);

    const noNutsToggle = screen.getByLabelText('No Nuts');
    await user.click(noNutsToggle);

    expect(mockOnNoNutsChange).toHaveBeenCalledWith(true);
  });

  it('should call onFavoritesOnlyChange when Favorites Only toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterToggles {...defaultProps} />);

    const favoritesToggle = screen.getByLabelText(/Favorites Only/i);
    await user.click(favoritesToggle);

    expect(mockOnFavoritesOnlyChange).toHaveBeenCalledWith(true);
  });

  it('should show "No recipes match your filters" when filteredCount is 0', () => {
    render(<FilterToggles {...defaultProps} filteredCount={0} />);

    expect(screen.getByText('No recipes match your filters')).toBeInTheDocument();
  });

  it('should show "No favorites yet" message when favoritesOnly is true and favoritesCount is 0', () => {
    render(
      <FilterToggles
        {...defaultProps}
        favoritesOnly={true}
        filteredCount={0}
        favoritesCount={0}
      />
    );

    expect(screen.getByText('No favorites yet - start liking recipes!')).toBeInTheDocument();
  });

  it('should reflect toggle states', () => {
    render(
      <FilterToggles
        {...defaultProps}
        noFat={true}
        noNuts={true}
        favoritesOnly={true}
      />
    );

    const noFatToggle = screen.getByLabelText('No Fat');
    const noNutsToggle = screen.getByLabelText('No Nuts');
    const favoritesToggle = screen.getByLabelText(/Favorites Only/i);

    // Radix UI switches use aria-checked instead of checked
    expect(noFatToggle).toHaveAttribute('aria-checked', 'true');
    expect(noNutsToggle).toHaveAttribute('aria-checked', 'true');
    expect(favoritesToggle).toHaveAttribute('aria-checked', 'true');
  });
});


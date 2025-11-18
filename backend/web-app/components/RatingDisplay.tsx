'use client';

interface RatingDisplayProps {
  overallScore: number;
  totalReviews: number;
  size?: 'small' | 'medium' | 'large';
}

export default function RatingDisplay({ overallScore, totalReviews, size = 'medium' }: RatingDisplayProps) {
  const starSize = size === 'small' ? 'text-sm' : size === 'large' ? 'text-2xl' : 'text-lg';
  const scoreSize = size === 'small' ? 'text-sm' : size === 'large' ? 'text-2xl' : 'text-lg';
  
  // Calculate filled stars (out of 5, based on score out of 10)
  const filledStars = Math.round((overallScore / 10) * 5);
  const emptyStars = 5 - filledStars;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[...Array(filledStars)].map((_, i) => (
          <span key={`filled-${i}`} className={`${starSize} text-yellow-500`}>⭐</span>
        ))}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className={`${starSize} text-gray-300 dark:text-gray-600`}>⭐</span>
        ))}
      </div>
      <span className={`${scoreSize} font-semibold ml-1`}>{overallScore.toFixed(1)}</span>
      {totalReviews > 0 && (
        <span className="text-xs text-gray-500 ml-1">({totalReviews})</span>
      )}
    </div>
  );
}


import React from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Star, MessageSquare, ExternalLink, Quote } from 'lucide-react';

export function ReviewsSection() {
  const { reviews, settings } = useRestaurant();

  const featuredReviews = reviews.filter(r => r.featured);
  const displayReviews = featuredReviews.length > 0 ? featuredReviews : reviews;

  if (displayReviews.length === 0) return null;

  return (
    <section id="reviews" className="py-16 sm:py-24 bg-white border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-700 font-bold mb-2">
              Customer Feedback
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              What Motihari Says
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              Honest thoughts and dining experiences shared by our valued guests.
            </p>
          </div>

          {settings.mapsUrl && (
            <a
              href={settings.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-700 hover:text-amber-800 transition-colors self-start sm:self-auto"
            >
              <span>View Google Reviews</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayReviews.map(rev => (
            <div
              key={rev.id}
              className="bg-stone-50/70 p-6 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  {/* Star Rating */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= rev.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-stone-300'
                        }`}
                      />
                    ))}
                  </div>

                  <Quote className="w-5 h-5 text-stone-300" />
                </div>

                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed mb-6 italic">
                  "{rev.reviewText}"
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200/60 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-stone-900">{rev.customerName}</div>
                  <div className="text-stone-400">{rev.source || 'Verified Customer'}</div>
                </div>

                {rev.reviewDate && (
                  <span className="text-[11px] text-stone-600 font-medium">{rev.reviewDate}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

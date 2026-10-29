import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { Instagram, Heart, MessageCircle, ExternalLink, Share2, CheckCircle2, Sparkles, Camera, ArrowRight, Check } from 'lucide-react';
import { useToast } from '../common/Toast.tsx';

interface InstagramPost {
  id: string;
  type?: string;
  mediaUrl: string;
  permalink: string;
  caption: string;
  likes?: string;
  comments?: string;
}

interface InstagramFeedData {
  profile: {
    handle: string;
    name: string;
    bio: string;
    url: string;
    isOfficial: boolean;
  };
  posts: InstagramPost[];
  liveSync?: boolean;
}

export function InstagramSection() {
  const { settings } = useRestaurant();
  const { showToast } = useToast();
  const [feedData, setFeedData] = useState<InstagramFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const officialUrl = settings.instagramUrl || 'https://www.instagram.com/onebite_motihari/';
  const officialHandle = '@onebite_motihari';

  useEffect(() => {
    let isMounted = true;
    async function fetchInstagramFeed() {
      try {
        const res = await fetch('/api/instagram/feed');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && data.posts) {
            setFeedData(data);
          }
        }
      } catch (e) {
        console.warn('Could not load Instagram API feed, using static showcase:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchInstagramFeed();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenInstagram = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If mobile device, attempt deep link launch to Instagram app
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      // Allow default link behavior which opens Instagram app or browser safely
      return;
    }
  };

  const handleShareProfile = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ONE BITE Motihari on Instagram',
          text: 'Check out official food posts, reels and offers from ONE BITE Motihari!',
          url: officialUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if share cancelled/unsupported
      }
    }
    navigator.clipboard.writeText(officialUrl);
    setCopiedLink(true);
    showToast('Instagram profile link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const posts = feedData?.posts || [
    {
      id: 'fallback_1',
      mediaUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      permalink: officialUrl,
      caption: 'Handcrafted Juicy Burgers loaded with melted cheese! Visit us at Arya Samaj Chowk, Motihari. 🍔✨ #OneBiteMotihari',
      likes: '1.2k',
      comments: '84',
    },
    {
      id: 'fallback_2',
      mediaUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
      permalink: officialUrl,
      caption: 'Golden Crispy Chicken Bucket — Freshly fried to perfection on every order! 🍗🔥 #OneBiteChicken #Motihari',
      likes: '950',
      comments: '62',
    },
    {
      id: 'fallback_3',
      mediaUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      permalink: officialUrl,
      caption: 'Pure Mozzarella Cheese Loaded Pizza straight out of the hot oven! 🍕🧀 #CheeseLovers #MotihariEats',
      likes: '1.8k',
      comments: '110',
    },
    {
      id: 'fallback_4',
      mediaUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80',
      permalink: officialUrl,
      caption: 'Signature Crispy Spiral Potato Tornado with special peri-peri seasoning! 🌪️🍟 #PotatoTornado #OneBite',
      likes: '2.1k',
      comments: '145',
    },
    {
      id: 'fallback_5',
      mediaUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
      permalink: officialUrl,
      caption: 'Rich Belgian Choco Lava Cake & Thick Chocolate Milkshakes! Pure bliss in Motihari. 🍫🥤 #OneBiteDesserts',
      likes: '1.4k',
      comments: '92',
    },
    {
      id: 'fallback_6',
      mediaUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80',
      permalink: officialUrl,
      caption: 'Warm, cozy family dining experience at ONE BITE Motihari. Bring your friends & family today! 👨‍👩‍👧‍👦❤️',
      likes: '1.6k',
      comments: '78',
    },
  ];

  return (
    <section
      id="instagram"
      className="py-16 sm:py-24 bg-stone-950 text-white relative overflow-hidden border-t border-stone-800"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 border-b border-stone-800/80 pb-8">
          <div className="text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-orange-500/20 border border-pink-500/30 text-pink-300 text-xs font-bold uppercase tracking-wider">
              <Camera className="w-3.5 h-3.5 text-pink-400" />
              <span>Official Instagram Community</span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Follow ONE BITE Motihari
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                <span>Verified Handle</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-400 max-w-xl">
              Stay connected for live food stories, special combo announcements, crispy bucket reels, and customer moments at Arya Samaj Chowk!
            </p>
          </div>

          {/* Profile CTA Box */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              onClick={handleOpenInstagram}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-pink-600/20 hover:shadow-pink-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Instagram className="w-5 h-5" />
              <span>Follow {officialHandle}</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </a>

            <button
              onClick={handleShareProfile}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white font-semibold text-sm border border-stone-800 transition-colors cursor-pointer"
              title="Share Instagram Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-stone-400" />}
              <span>{copiedLink ? 'Copied Link!' : 'Share Profile'}</span>
            </button>
          </div>
        </div>

        {/* Post Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, idx) => (
            <a
              key={post.id || idx}
              href={post.permalink || officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="group relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-800/80 shadow-md hover:border-amber-500/50 transition-all duration-300 transform hover:-translate-y-1 block"
            >
              {/* Image Container */}
              <div className="aspect-square w-full overflow-hidden bg-stone-900 relative">
                <img
                  src={post.mediaUrl}
                  alt={`ONE BITE Motihari Instagram Post ${idx + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Top Instagram Overlay Badge */}
                <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-stone-950/75 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                  <Instagram className="w-4 h-4 text-pink-400" />
                </div>

                {/* Hover Gradient Mask & Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/40 to-transparent opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <p className="text-xs text-stone-200 line-clamp-2 font-medium mb-3 leading-relaxed">
                    {post.caption}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-semibold text-stone-300">
                    <div className="flex items-center gap-4">
                      {post.likes && (
                        <span className="flex items-center gap-1 text-pink-400">
                          <Heart className="w-3.5 h-3.5 fill-pink-400/20" />
                          <span>{post.likes}</span>
                        </span>
                      )}
                      {post.comments && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{post.comments}</span>
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-amber-300 group-hover:underline">
                      <span>View Post</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Bottom Banner Callout */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-stone-900 via-stone-900/90 to-amber-950/40 border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Get Featured on Our Page</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white">
              Visiting ONE BITE Motihari? Tag Us in Your Stories!
            </h3>
            <p className="text-xs sm:text-sm text-stone-400">
              Post your meal or reel with <strong className="text-amber-300">#OneBiteMotihari</strong> and tag <strong className="text-pink-400">{officialHandle}</strong> for a chance to win exclusive discount vouchers!
            </p>
          </div>

          <a
            href={officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-amber-500/20"
          >
            <span>Visit Instagram Profile</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

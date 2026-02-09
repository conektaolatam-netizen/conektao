import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, AlertTriangle, Trophy, Music, Users } from 'lucide-react';

interface NewsEvent {
  title: string;
  description: string;
  category: string;
  impactProbability: number;
  source: string;
}

interface NewsData {
  events: NewsEvent[];
  topEvent: NewsEvent | null;
  recommendation: string;
}

interface NewsImpactCardProps {
  news: NewsData | null;
  isLoading: boolean;
}

const NewsImpactCard: React.FC<NewsImpactCardProps> = ({ news, isLoading }) => {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'deportes':
        return <Trophy className="w-5 h-5 text-[#2D5F2D]" />;
      case 'entretenimiento':
        return <Music className="w-5 h-5 text-[#5C4033]" />;
      case 'protesta':
      case 'manifestación':
        return <Users className="w-5 h-5 text-[#8B2500]" />;
      default:
        return <Newspaper className="w-5 h-5 text-[#5C4033]" />;
    }
  };

  const getImpactBorder = (probability: number) => {
    if (probability >= 80) return 'border-l-[#8B2500]';
    if (probability >= 60) return 'border-l-[#8B6914]';
    if (probability >= 40) return 'border-l-[#8B6914]';
    return 'border-l-[#2D5F2D]';
  };

  const getImpactTextColor = (probability: number) => {
    if (probability >= 70) return 'text-[#8B2500]';
    if (probability >= 50) return 'text-[#8B6914]';
    return 'text-[#2D5F2D]';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#E8DFD4] shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-6 bg-[#F0ECE6] rounded" />
          <div className="h-4 w-48 bg-[#F0ECE6] rounded" />
          <div className="h-20 bg-[#F0ECE6] rounded" />
        </div>
      </div>
    );
  }

  if (!news) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="bg-white rounded-xl border border-[#E8DFD4] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[#5C4033]" />
              <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wider">Eventos & Noticias</p>
            </div>
            {news.topEvent && news.topEvent.impactProbability >= 70 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="flex items-center gap-1 bg-white border border-[#8B2500]/30 text-[#8B2500] px-2.5 py-1 rounded-full text-xs font-semibold"
              >
                <AlertTriangle className="w-3 h-3" />
                Alto Impacto
              </motion.div>
            )}
          </div>

          {/* Top Event */}
          {news.topEvent && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-4 bg-white rounded-lg border border-[#E8DFD4] overflow-hidden"
            >
              <div className={`border-l-[3px] ${getImpactBorder(news.topEvent.impactProbability)} p-4`}>
                <div className="flex items-start gap-3">
                  {getCategoryIcon(news.topEvent.category)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-[#4A3728] text-sm mb-1">
                      {news.topEvent.title}
                    </h4>
                    <p className="text-xs text-[#6B5744] mb-2">
                      {news.topEvent.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#8B7355]">
                        Fuente: {news.topEvent.source}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#8B7355]">Impacto:</span>
                        <span className={`text-sm font-bold ${getImpactTextColor(news.topEvent.impactProbability)}`}>
                          {news.topEvent.impactProbability}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Impact Gauge */}
          {news.topEvent && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-[#6B5744] mb-1">
                <span>Probabilidad de afectar ventas</span>
                <span className="font-medium">{news.topEvent.impactProbability}%</span>
              </div>
              <div className="h-1.5 bg-[#F0ECE6] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${news.topEvent.impactProbability}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className={`h-full rounded-full ${
                    news.topEvent.impactProbability >= 70 ? 'bg-[#8B2500]' :
                    news.topEvent.impactProbability >= 50 ? 'bg-[#8B6914]' :
                    'bg-[#2D5F2D]'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Other Events */}
          {news.events.length > 1 && (
            <div className="space-y-2 mb-4">
              {news.events.slice(1, 3).map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-[#E8DFD4]"
                >
                  {getCategoryIcon(event.category)}
                  <span className="text-xs text-[#4A3728] flex-1 truncate">{event.title}</span>
                  <span className={`text-xs font-semibold ${getImpactTextColor(event.impactProbability)}`}>
                    {event.impactProbability}%
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Recommendation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg border border-[#E8DFD4] overflow-hidden"
          >
            <div className="border-l-[3px] border-l-[#5C4033] p-3">
              <p className="text-sm text-[#4A3728] leading-relaxed">
                {news.recommendation}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default NewsImpactCard;

import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, AlertTriangle, Trophy, Music, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
        return <Trophy className="w-5 h-5 text-emerald-600" />;
      case 'entretenimiento':
        return <Music className="w-5 h-5 text-violet-600" />;
      case 'protesta':
      case 'manifestación':
        return <Users className="w-5 h-5 text-rose-600" />;
      default:
        return <Newspaper className="w-5 h-5 text-sky-600" />;
    }
  };

  const getImpactColor = (probability: number) => {
    if (probability >= 80) return 'text-[#4A3728] bg-gradient-to-br from-[#FDF8F3] to-[#F5EDE4] border-2 border-[#8B7355] shadow-[0_0_15px_rgba(139,115,85,0.2)]';
    if (probability >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
    if (probability >= 40) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  };

  if (isLoading) {
    return (
      <Card className="bg-white border-[#D4C4B0] shadow-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-6 bg-[#E8DFD4] rounded" />
            <div className="h-4 w-48 bg-[#E8DFD4] rounded" />
            <div className="h-20 bg-[#E8DFD4] rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!news) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-white border-[#D4C4B0] shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[#5C4033]" />
              <p className="text-sm text-[#8B7355] font-medium">Eventos & Noticias</p>
            </div>
            {news.topEvent && news.topEvent.impactProbability >= 70 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-md"
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
              className={`p-4 rounded-lg border mb-4 ${getImpactColor(news.topEvent.impactProbability)}`}
            >
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
                      <span className={`text-sm font-bold ${
                        news.topEvent.impactProbability >= 70 ? 'text-rose-600' : 
                        news.topEvent.impactProbability >= 50 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {news.topEvent.impactProbability}%
                      </span>
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
              <div className="h-2 bg-[#E8DFD4] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${news.topEvent.impactProbability}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className={`h-full rounded-full ${
                    news.topEvent.impactProbability >= 70 ? 'bg-gradient-to-r from-rose-400 to-rose-600' :
                    news.topEvent.impactProbability >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                    'bg-gradient-to-r from-emerald-400 to-emerald-600'
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
                  className="flex items-center gap-2 p-2 bg-[#F5EDE4] rounded-lg border border-[#E8DFD4]"
                >
                  {getCategoryIcon(event.category)}
                  <span className="text-xs text-[#4A3728] flex-1 truncate">{event.title}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    event.impactProbability >= 50 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-[#E8DFD4] text-[#6B5744]'
                  }`}>
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
            className="p-3 bg-[#FDF8F3] rounded-lg border border-[#E8DFD4]"
          >
            <p className="text-sm text-[#4A3728] leading-relaxed">
              {news.recommendation}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NewsImpactCard;

import React from 'react';
import { motion } from 'framer-motion';
import { Newspaper, AlertTriangle, Trophy, Music, Users, MapPin } from 'lucide-react';
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
        return <Trophy className="w-5 h-5 text-green-600" />;
      case 'entretenimiento':
        return <Music className="w-5 h-5 text-purple-600" />;
      case 'protesta':
      case 'manifestación':
        return <Users className="w-5 h-5 text-red-600" />;
      default:
        return <Newspaper className="w-5 h-5 text-blue-600" />;
    }
  };

  const getImpactColor = (probability: number) => {
    if (probability >= 80) return 'text-red-600 bg-red-50 border-red-200';
    if (probability >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    if (probability >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#5C4033]/5 to-[#8B7355]/5 border-[#5C4033]/10">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-6 bg-[#5C4033]/10 rounded" />
            <div className="h-4 w-48 bg-[#5C4033]/10 rounded" />
            <div className="h-20 bg-[#5C4033]/10 rounded" />
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
      <Card className="bg-gradient-to-br from-[#5C4033]/5 to-[#8B7355]/10 border-[#5C4033]/10 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-yellow-500/5 pointer-events-none" />
        
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[#5C4033]" />
              <p className="text-sm text-[#5C4033]/60 font-medium">Eventos & Noticias</p>
            </div>
            {news.topEvent && news.topEvent.impactProbability >= 70 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium"
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
                  <h4 className="font-semibold text-[#5C4033] text-sm mb-1">
                    {news.topEvent.title}
                  </h4>
                  <p className="text-xs text-[#5C4033]/70 mb-2">
                    {news.topEvent.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#5C4033]/50">
                      Fuente: {news.topEvent.source}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#5C4033]/50">Impacto:</span>
                      <span className={`text-sm font-bold ${
                        news.topEvent.impactProbability >= 70 ? 'text-red-600' : 
                        news.topEvent.impactProbability >= 50 ? 'text-orange-600' : 'text-green-600'
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
              <div className="flex items-center justify-between text-xs text-[#5C4033]/60 mb-1">
                <span>Probabilidad de afectar ventas</span>
                <span className="font-medium">{news.topEvent.impactProbability}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${news.topEvent.impactProbability}%` }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className={`h-full rounded-full ${
                    news.topEvent.impactProbability >= 70 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                    news.topEvent.impactProbability >= 50 ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                    'bg-gradient-to-r from-green-400 to-green-600'
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
                  className="flex items-center gap-2 p-2 bg-[#F5F0E8] rounded-lg"
                >
                  {getCategoryIcon(event.category)}
                  <span className="text-xs text-[#5C4033] flex-1 truncate">{event.title}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    event.impactProbability >= 50 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
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
            className="p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-100"
          >
            <p className="text-sm text-[#5C4033] leading-relaxed">
              {news.recommendation}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NewsImpactCard;

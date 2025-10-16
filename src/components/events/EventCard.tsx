import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Trophy, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string;
    event_type: string;
    event_date: string;
    registration_deadline: string;
    entry_fee?: number;
    prize_pool?: number;
    cover_image?: string;
    capacity?: number;
    location?: string;
    status: string;
  };
}

export default function EventCard({ event }: EventCardProps) {
  const isCompetition = event.event_type === 'competition';
  const eventDate = new Date(event.event_date);
  const registrationDeadline = new Date(event.registration_deadline);
  const now = new Date();
  const daysUntilDeadline = Math.ceil((registrationDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'competition':
        return 'bg-purple-100 text-purple-700';
      case 'workshop':
        return 'bg-blue-100 text-blue-700';
      case 'fundraiser':
        return 'bg-green-100 text-green-700';
      case 'exhibition':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
    >
      <Link to={`/events/${event.id}`}>
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-br from-sage-100 to-sage-200">
          {event.cover_image ? (
            <img
              src={event.cover_image}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-sage-400 opacity-50" />
            </div>
          )}
          
          {/* Event Type Badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEventTypeColor(event.event_type)}`}>
              {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}
            </span>
          </div>

          {/* Deadline Warning */}
          {daysUntilDeadline <= 7 && daysUntilDeadline > 0 && (
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                {daysUntilDeadline} {daysUntilDeadline === 1 ? 'day' : 'days'} left
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-charcoal-300 mb-2 line-clamp-2">
            {event.title}
          </h3>
          
          <p className="text-charcoal-200 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>

          {/* Event Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-charcoal-200">
              <Calendar className="w-4 h-4 text-sage-400" />
              <span>
                {eventDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-sm text-charcoal-200">
                <MapPin className="w-4 h-4 text-sage-400" />
                <span>{event.location}</span>
              </div>
            )}

            {event.capacity && (
              <div className="flex items-center gap-2 text-sm text-charcoal-200">
                <Users className="w-4 h-4 text-sage-400" />
                <span>Limited to {event.capacity} participants</span>
              </div>
            )}
          </div>

          {/* Competition-specific info */}
          {isCompetition && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {event.prize_pool && (
                <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                  <Trophy className="w-4 h-4" />
                  <span>R{event.prize_pool.toLocaleString()} Prize Pool</span>
                </div>
              )}
              {event.entry_fee && (
                <div className="flex items-center gap-1 text-sm text-charcoal-200">
                  <DollarSign className="w-4 h-4" />
                  <span>R{event.entry_fee.toFixed(2)} Entry</span>
                </div>
              )}
            </div>
          )}

          {/* Workshop-specific info */}
          {event.event_type === 'workshop' && event.entry_fee && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-charcoal-200">Registration Fee</span>
                <span className="text-lg font-bold text-sage-600">R{event.entry_fee.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-sage-400 text-white py-2 rounded-lg font-semibold hover:bg-sage-500 transition-colors"
            >
              View Details
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}


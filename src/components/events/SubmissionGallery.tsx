import { useState } from 'react';
import { Trophy, Medal, Award, Heart, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface Submission {
  id: string;
  title: string;
  description?: string;
  submission_url: string;
  submission_thumbnail?: string;
  user_id: string;
  award_place?: number;
  total_score?: number;
  public_votes?: number;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface SubmissionGalleryProps {
  submissions: Submission[];
  showVoting?: boolean;
  onVote?: (submissionId: string) => void;
}

export default function SubmissionGallery({ 
  submissions, 
  showVoting = false,
  onVote 
}: SubmissionGalleryProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Sort submissions: winners first, then by score
  const sortedSubmissions = [...submissions].sort((a, b) => {
    if (a.award_place && !b.award_place) return -1;
    if (!a.award_place && b.award_place) return 1;
    if (a.award_place && b.award_place) return a.award_place - b.award_place;
    return (b.total_score || 0) - (a.total_score || 0);
  });

  const getAwardBadge = (place?: number) => {
    if (!place) return null;

    const badges = {
      1: { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50', label: '1st Place' },
      2: { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-50', label: '2nd Place' },
      3: { icon: Award, color: 'text-orange-600', bg: 'bg-orange-50', label: '3rd Place' },
    };

    const badge = badges[place as keyof typeof badges];
    if (!badge) return null;

    const Icon = badge.icon;

    return (
      <div className={`absolute top-3 left-3 ${badge.bg} ${badge.color} px-3 py-1 rounded-full flex items-center gap-2 font-semibold text-sm shadow-lg`}>
        <Icon className="w-4 h-4" />
        <span>{badge.label}</span>
      </div>
    );
  };

  return (
    <div>
      {/* Winners Section */}
      {sortedSubmissions.some(s => s.award_place) && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-charcoal-300 mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Winners
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {sortedSubmissions
              .filter(s => s.award_place && s.award_place <= 3)
              .map((submission) => (
                <motion.div
                  key={submission.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <div className="relative aspect-square">
                    <img
                      src={submission.submission_thumbnail || submission.submission_url}
                      alt={submission.title}
                      className="w-full h-full object-cover"
                    />
                    {getAwardBadge(submission.award_place)}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-charcoal-300 mb-1">{submission.title}</h3>
                    <p className="text-sm text-charcoal-200">
                      by {submission.profiles?.full_name || 'Anonymous'}
                    </p>
                    {submission.total_score && (
                      <div className="mt-2 text-sm text-sage-600 font-semibold">
                        Score: {submission.total_score.toFixed(2)}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      {/* All Submissions */}
      <div>
        <h2 className="text-2xl font-bold text-charcoal-300 mb-6">
          {sortedSubmissions.some(s => s.award_place) ? 'All Submissions' : 'Submissions'}
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedSubmissions.map((submission) => (
            <motion.div
              key={submission.id}
              whileHover={{ y: -4 }}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setSelectedSubmission(submission)}
            >
              <div className="relative aspect-square">
                <img
                  src={submission.submission_thumbnail || submission.submission_url}
                  alt={submission.title}
                  className="w-full h-full object-cover"
                />
                {submission.award_place && getAwardBadge(submission.award_place)}
                
                {/* Vote Count */}
                {submission.public_votes !== undefined && submission.public_votes > 0 && (
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-sm">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="font-semibold">{submission.public_votes}</span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-bold text-charcoal-300 mb-1 line-clamp-1">
                  {submission.title}
                </h3>
                <p className="text-sm text-charcoal-200">
                  by {submission.profiles?.full_name || 'Anonymous'}
                </p>
                
                {showVoting && onVote && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVote(submission.id);
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 border border-sage-400 text-sage-600 rounded-lg hover:bg-sage-50 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-semibold">Vote</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSubmission(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={selectedSubmission.submission_url}
                alt={selectedSubmission.title}
                className="w-full max-h-[60vh] object-contain bg-gray-100"
              />
              {selectedSubmission.award_place && getAwardBadge(selectedSubmission.award_place)}
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-charcoal-300 mb-2">
                    {selectedSubmission.title}
                  </h2>
                  <p className="text-charcoal-200">
                    by {selectedSubmission.profiles?.full_name || 'Anonymous'}
                  </p>
                </div>
                
                {selectedSubmission.total_score && (
                  <div className="text-right">
                    <div className="text-sm text-charcoal-200">Score</div>
                    <div className="text-2xl font-bold text-sage-600">
                      {selectedSubmission.total_score.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
              
              {selectedSubmission.description && (
                <p className="text-charcoal-200 mb-4">{selectedSubmission.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-charcoal-200">
                {selectedSubmission.public_votes !== undefined && (
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{selectedSubmission.public_votes} votes</span>
                  </div>
                )}
              </div>
              
              {showVoting && onVote && (
                <button
                  onClick={() => onVote(selectedSubmission.id)}
                  className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-sage-400 text-white rounded-lg hover:bg-sage-500 transition-colors font-semibold"
                >
                  <Heart className="w-5 h-5" />
                  <span>Vote for this submission</span>
                </button>
              )}
              
              <button
                onClick={() => setSelectedSubmission(null)}
                className="mt-4 w-full px-6 py-3 border border-gray-300 rounded-lg font-semibold text-charcoal-300 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


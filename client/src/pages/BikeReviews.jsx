import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FaStar,
  FaRegStar,
  FaThumbsUp,
  FaThumbsDown,
  FaChevronDown,
  FaChevronUp,
  FaReply,
  FaTrash,
  FaEdit,
  FaTimes,
  FaArrowLeft,
  FaPaperPlane,
  FaMotorcycle,
  FaCommentDots
} from 'react-icons/fa';

// Star Rating Component
const StarRating = ({ rating, onRate, interactive = false, size = 'text-xl' }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRate(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`${size} transition-all duration-200 ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
          disabled={!interactive}
        >
          {star <= (hover || rating) ? (
            <FaStar className="text-yellow-400 drop-shadow-sm" />
          ) : (
            <FaRegStar className="text-gray-300" />
          )}
        </button>
      ))}
    </div>
  );
};

// Time ago helper
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
};

// Avatar Component
const UserAvatar = ({ name, size = 'w-10 h-10 text-sm' }) => {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const colors = [
    'from-red-500 to-orange-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-purple-500 to-pink-500',
    'from-yellow-500 to-amber-500',
    'from-indigo-500 to-violet-500',
  ];
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  return (
    <div className={`${size} rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold shadow-md flex-shrink-0`}>
      {initial}
    </div>
  );
};

// Single Comment Component
const CommentItem = ({ comment, reviewId, user, onUpdate }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/reviews/${reviewId}/comments/${comment._id}/replies`, {
        content: replyText
      });
      setReplyText('');
      setShowReplyInput(false);
      onUpdate();
      toast.success('Reply added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async () => {
    try {
      await axios.delete(`/api/reviews/${reviewId}/comments/${comment._id}`);
      onUpdate();
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="py-3"
    >
      <div className="flex gap-3">
        <UserAvatar name={comment.user?.name} size="w-8 h-8 text-xs" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-gray-800">{comment.user?.name}</span>
            <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
          <div className="flex items-center gap-3 mt-2">
            {user && (
              <button
                onClick={() => setShowReplyInput(!showReplyInput)}
                className="text-xs text-gray-500 hover:text-primary-600 flex items-center gap-1 font-medium transition-colors"
              >
                <FaReply className="text-[10px]" /> Reply
              </button>
            )}
            {user && comment.user?._id === user._id && (
              <button
                onClick={handleDeleteComment}
                className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <FaTrash className="text-[10px]" /> Delete
              </button>
            )}
            {comment.replies?.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-semibold transition-colors"
              >
                {showReplies ? <FaChevronUp /> : <FaChevronDown />}
                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>

          {/* Reply input */}
          <AnimatePresence>
            {showReplyInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyDown={e => e.key === 'Enter' && handleReply()}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReply}
                    disabled={submitting || !replyText.trim()}
                    className="bg-primary-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-primary-700 transition-colors"
                  >
                    <FaPaperPlane />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Replies */}
          <AnimatePresence>
            {showReplies && comment.replies?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-4 mt-2 border-l-2 border-gray-100 pl-4 space-y-3"
              >
                {comment.replies.map((reply) => (
                  <div key={reply._id} className="flex gap-2">
                    <UserAvatar name={reply.user?.name} size="w-6 h-6 text-[10px]" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-800">{reply.user?.name}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(reply.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-700 mt-0.5">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Single Review Card
const ReviewCard = ({ review, user, onUpdate, isPinned = false }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [liking, setLiking] = useState(false);

  const userLiked = user && review.likes?.includes(user._id);
  const userDisliked = user && review.dislikes?.includes(user._id);

  const handleLike = async () => {
    if (!user) return toast.error('Please login to like reviews');
    if (liking) return;
    setLiking(true);
    try {
      await axios.post(`/api/reviews/${review._id}/like`);
      onUpdate();
    } catch (error) {
      toast.error('Failed to like review');
    } finally {
      setLiking(false);
    }
  };

  const handleDislike = async () => {
    if (!user) return toast.error('Please login to dislike reviews');
    if (liking) return;
    setLiking(true);
    try {
      await axios.post(`/api/reviews/${review._id}/dislike`);
      onUpdate();
    } catch (error) {
      toast.error('Failed to dislike review');
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      await axios.post(`/api/reviews/${review._id}/comments`, {
        content: commentText
      });
      setCommentText('');
      onUpdate();
      toast.success('Comment added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all hover:shadow-xl ${
        isPinned
          ? 'border-primary-300 bg-gradient-to-br from-primary-50/50 to-accent-50/30'
          : 'border-gray-100 hover:border-primary-200'
      }`}
    >
      {isPinned && (
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            Your Review
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar name={review.user?.name} />
          <div>
            <h4 className="font-bold text-gray-800">{review.user?.name}</h4>
            <p className="text-xs text-gray-400">{timeAgo(review.createdAt)}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="text-sm" />
      </div>

      {/* Content */}
      <div className="mt-4">
        <h3 className="font-bold text-lg text-gray-800 mb-1">{review.title}</h3>
        <p className="text-gray-600 leading-relaxed">{review.content}</p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            userLiked ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'
          }`}
        >
          <FaThumbsUp /> <span>{review.likes?.length || 0}</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleDislike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            userDisliked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <FaThumbsDown /> <span>{review.dislikes?.length || 0}</span>
        </motion.button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 font-medium transition-colors ml-auto"
        >
          <FaCommentDots />
          <span>{review.comments?.length || 0} {review.comments?.length === 1 ? 'comment' : 'comments'}</span>
          {showComments ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 border-t border-gray-100"
          >
            {/* Comment input */}
            {user && (
              <div className="flex gap-2 pt-3">
                <UserAvatar name={user.name} size="w-8 h-8 text-xs" />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddComment}
                    disabled={submittingComment || !commentText.trim()}
                    className="bg-primary-600 text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-primary-700 transition-colors"
                  >
                    <FaPaperPlane />
                  </motion.button>
                </div>
              </div>
            )}

            {/* Comments list */}
            <div className="divide-y divide-gray-50">
              {review.comments?.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  reviewId={review._id}
                  user={user}
                  onUpdate={onUpdate}
                />
              ))}
              {(!review.comments || review.comments.length === 0) && (
                <p className="text-sm text-gray-400 py-3 text-center">No comments yet. Be the first to comment!</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== MAIN PAGE ====================
const BikeReviews = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [bike, setBike] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Write review form
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ rating: 0, title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBike();
    fetchReviews();
    if (user) fetchMyReview();
  }, [id, page]);

  useEffect(() => {
    if (user) fetchMyReview();
  }, [user]);

  const fetchBike = async () => {
    try {
      const { data } = await axios.get(`/api/bikes/${id}`);
      setBike(data);
    } catch {
      toast.error('Failed to load bike');
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await axios.get(`/api/reviews/${id}?page=${page}&limit=10`);
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReview = async () => {
    try {
      const { data } = await axios.get(`/api/reviews/${id}/my-review`);
      setMyReview(data.review);
    } catch {
      // User hasn't reviewed — that's fine
    }
  };

  const refreshAll = () => {
    fetchReviews();
    if (user) fetchMyReview();
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (formData.rating === 0) return toast.error('Please select a rating');
    if (!formData.title.trim()) return toast.error('Please add a title');
    if (!formData.content.trim()) return toast.error('Please write your review');

    setSubmitting(true);
    try {
      if (editMode && myReview) {
        await axios.put(`/api/reviews/${myReview._id}`, formData);
        toast.success('Review updated!');
      } else {
        await axios.post(`/api/reviews/${id}`, formData);
        toast.success('Review submitted!');
      }
      setShowForm(false);
      setEditMode(false);
      setFormData({ rating: 0, title: '', content: '' });
      refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = () => {
    setFormData({
      rating: myReview.rating,
      title: myReview.title,
      content: myReview.content
    });
    setEditMode(true);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteReview = async () => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await axios.delete(`/api/reviews/${myReview._id}`);
      toast.success('Review deleted');
      setMyReview(null);
      refreshAll();
    } catch {
      toast.error('Failed to delete review');
    }
  };

  // Filter out user's own review from the list
  const otherReviews = reviews.filter(r => !myReview || r._id !== myReview._id);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center items-center">
        <LoadingSpinner size={300} text="Loading reviews..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to={`/bikes/${id}`}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold mb-4 transition-colors group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to {bike?.name || 'Bike Details'}</span>
          </Link>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
              <FaStar className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Reviews for {bike?.name}
              </h1>
              <p className="text-gray-500 mt-1">
                {pagination?.total || 0} {pagination?.total === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Write Review Button / Form */}
        {user && !myReview && !showForm && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(true)}
            className="w-full mb-6 bg-gradient-to-r from-primary-600 to-accent-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <FaEdit /> Write a Review
          </motion.button>
        )}

        {!user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6 text-center"
          >
            <p className="text-gray-600">
              <Link to="/login" className="text-primary-600 font-bold hover:underline">Log in</Link> to write a review or interact with reviews
            </p>
          </motion.div>
        )}

        {/* Review Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <form
                onSubmit={handleSubmitReview}
                className="bg-white rounded-2xl p-6 shadow-xl border-2 border-primary-200"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">
                    {editMode ? 'Edit Your Review' : 'Write a Review'}
                  </h3>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setShowForm(false); setEditMode(false); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="text-xl" />
                  </motion.button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Rating</label>
                  <StarRating
                    rating={formData.rating}
                    onRate={(r) => setFormData(prev => ({ ...prev, rating: r }))}
                    interactive
                    size="text-3xl"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Sum up your experience..."
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    maxLength={150}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Review</label>
                  <textarea
                    value={formData.content}
                    onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Tell others about your experience with this bike..."
                    rows={4}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    maxLength={5000}
                  />
                  <p className="text-xs text-gray-400 text-right mt-1">{formData.content.length}/5000</p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-primary-600 to-accent-500 text-white py-3 rounded-xl font-bold text-lg disabled:opacity-50 hover:from-primary-700 hover:to-accent-600 transition-all shadow-lg"
                >
                  {submitting ? 'Submitting...' : editMode ? 'Update Review' : 'Submit Review'}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User's own review (pinned) */}
        {myReview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-end gap-2 mb-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEditReview}
                className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
              >
                <FaEdit /> Edit
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteReview}
                className="text-sm text-red-500 hover:text-red-600 font-semibold flex items-center gap-1"
              >
                <FaTrash /> Delete
              </motion.button>
            </div>
            <ReviewCard review={myReview} user={user} onUpdate={refreshAll} isPinned />
          </motion.div>
        )}

        {/* Other Reviews */}
        <div className="space-y-4">
          {otherReviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              user={user}
              onUpdate={refreshAll}
            />
          ))}
        </div>

        {/* Empty State */}
        {reviews.length === 0 && !myReview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-12 shadow-lg border-2 border-gray-100 text-center"
          >
            <FaMotorcycle className="text-6xl text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500 mb-2">No Reviews Yet</h3>
            <p className="text-gray-400">Be the first to review this bike!</p>
          </motion.div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <motion.button
                key={p}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-full font-bold text-sm transition-all ${
                  p === page
                    ? 'bg-gradient-to-r from-primary-600 to-accent-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
                }`}
              >
                {p}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BikeReviews;

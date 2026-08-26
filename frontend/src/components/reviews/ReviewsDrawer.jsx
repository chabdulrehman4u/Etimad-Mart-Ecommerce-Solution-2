import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AiOutlineClose } from "react-icons/ai";
import { getReviewsBySlug } from "../../functions/product";

const StarRow = ({ count, filled }) => (
  <div className="flex items-center gap-1">
    {[...Array(count)].map((_, i) => (
      <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${i < filled ? "text-yellow-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.125-6.529L.824 6.82l6.58-.953L10 .5l2.516 5.367 6.58.953-4.423 4.74 1.125 6.529L10 15z"/></svg>
    ))}
  </div>
);

const ReviewsDrawer = ({ open, onClose, slug, product, onWriteReview }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoading(true);
        const res = await getReviewsBySlug(slug);
        setReviews(res?.reviews || []);
      } catch (e) {
        console.error("[ReviewsDrawer] fetch error", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, slug]);

  const ratingSummary = useMemo(() => {
    const summary = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => { if (summary[r.rating] != null) summary[r.rating]++; });
    return summary;
  }, [reviews]);

  const avg = useMemo(() => {
    if (!reviews.length) return 0;
    const total = reviews.reduce((s, r) => s + (r.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  // Animation variants
  const containerStagger = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.15 }
    }
  };
  // Subtle 3D "from behind" fade-in
  const itemBehindFade = {
    hidden: { opacity: 0, y: 24, scale: 0.9, rotateX: -6, filter: 'blur(10px)' },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.7, ease: 'easeOut' }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[10000] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Centered modal container */}
          <motion.div
            className="fixed inset-0 z-[10001] flex items-center justify-center p-2 sm:p-4"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
          >
            <motion.div
              className="relative z-[10002] w-full max-w-5xl bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col max-h-[88vh]"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <span className="text-xl font-semibold">Customer Reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={onWriteReview} className="px-3 py-2 rounded bg-secondary text-primary font-semibold hover:brightness-110">Write a review</button>
                <button aria-label="Close" onClick={onClose} className="p-2 rounded hover:bg-gray-100"><AiOutlineClose className="w-6 h-6"/></button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto" style={{ perspective: 800 }}>
              {/* Summary */}
              <motion.div
                variants={containerStagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4"
              >
                <motion.div variants={itemBehindFade} className="flex items-center gap-3">
                  <div className="text-4xl font-bold">{avg}</div>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${i < Math.round(avg) ? "text-yellow-400" : "text-gray-300"}`} viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.034a1 1 0 00-1.175 0l-2.802 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{product?.title}</span>
                  </div>
                </motion.div>
                <motion.div variants={itemBehindFade} className="sm:col-span-2 space-y-2">
                  {[5,4,3,2,1].map(star => (
                    <motion.div key={star} variants={itemBehindFade} className="flex items-center gap-2">
                      <StarRow count={5} filled={star} />
                      <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
                        <motion.div
                          className="bg-yellow-400 h-2 rounded"
                          initial={{ width: 0 }}
                          animate={{ width: `${reviews.length ? (ratingSummary[star] / reviews.length) * 100 : 0}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-8 text-right">{ratingSummary[star]}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Grid */}
              {loading ? (
                <div className="py-10 text-center text-gray-500">Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="py-10 text-center text-gray-500">No reviews yet.</div>
              ) : (
                <motion.div
                  variants={containerStagger}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {reviews.map(r => (
                    <motion.div key={r._id} variants={itemBehindFade} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{r?.reviewerId?.username || "Anonymous"}</div>
                        <StarRow count={5} filled={r.rating || 0} />
                      </div>
                      <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{r.reviewText}</div>
                      {Array.isArray(r.images) && r.images.length > 0 && (
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {r.images.map((img, i) => (
                            <motion.img
                              key={i}
                              src={img}
                              alt="review"
                              className="w-16 h-16 object-cover rounded"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              whileHover={{ scale: 1.03 }}
                              transition={{ duration: 0.2 }}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              
            </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReviewsDrawer;

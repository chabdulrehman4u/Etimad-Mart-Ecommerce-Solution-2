import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import { BiCategory } from 'react-icons/bi';
import { Link } from 'react-router-dom';

const CategoriesModal = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  // Handle both new categories array and old category format for backward compatibility
  const categories = product.categories?.length > 0 
    ? product.categories 
    : product.category 
      ? [product.category] 
      : [];

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: -50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: -50,
      transition: {
        duration: 0.2
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const categoryVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full h-auto max-h-[85vh] overflow-hidden flex flex-col"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-secondary p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BiCategory className="text-2xl" />
                    <div>
                      <h2 className="text-xl font-bold">Product Categories</h2>
                      <p className="text-sm opacity-90 mt-1">
                        {product.title?.length > 30 
                          ? `${product.title.substring(0, 30)}...` 
                          : product.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-white/20"
                  >
                    <IoClose className="text-2xl" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                {categories.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-600">
                        {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
                      </span>
                      <div className="h-px bg-gray-200 flex-1 ml-3"></div>
                    </div>
                    
                    {categories.map((category, index) => (
                      <motion.div
                        key={category._id || index}
                        custom={index}
                        variants={categoryVariants}
                        initial="hidden"
                        animate="visible"
                        className="group"
                      >
                        <Link
                          to={`/category/${category.slug}`}
                          className="flex items-center p-4 bg-gray-50 hover:bg-primary/5 rounded-xl border border-gray-100 hover:border-primary/20 transition-all duration-200 no-underline group-hover:shadow-md"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm mr-4">
                            {category.name?.charAt(0)?.toUpperCase() || 'C'}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 group-hover:text-primary transition-colors">
                              {category.name}
                            </h3>
                            {category.slug && (
                              <p className="text-xs text-gray-500 mt-1">
                                /{category.slug}
                              </p>
                            )}
                          </div>
                          <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BiCategory className="text-4xl text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No categories assigned</p>
                    <p className="text-sm text-gray-400 mt-1">
                      This product doesn't have any categories yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="flex justify-between items-center">
                  <Link
                    to={`/edit-product/${product.slug}`}
                    className="text-sm text-primary hover:text-primary/80 font-medium no-underline"
                  >
                    Edit Product Categories
                  </Link>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CategoriesModal;

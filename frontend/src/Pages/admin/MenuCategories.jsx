import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { getAllCategories, updateMenuCategory } from '../../functions/categories';
import { setSelectedCategories } from '../../store/selectedCategoriesSlice';
import toast from 'react-hot-toast';

const MenuCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const selectedCategories = useSelector((state) => state.selectedCategories.selectedCategories);
    const dispatch = useDispatch();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const response = await getAllCategories();
                // console.log("All categories ---->" , response.categories)
                setCategories(response.categories);
                
                // Initialize selected categories with those having menu: true
                const menuCategories = response.categories.filter(cat => cat.menu);
                dispatch(setSelectedCategories(menuCategories));
            } catch (error) {
                console.error('Error fetching categories:', error);
                toast.error('Failed to load categories');
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [dispatch]);

    const handleCategorySelect = async (category) => {
        const isSelected = selectedCategories.some(cat => cat._id === category._id);
        const newMenuStatus = !isSelected;
        
        try {
            // Optimistic UI update
            if (isSelected) {
                dispatch(setSelectedCategories(
                    selectedCategories.filter(cat => cat._id !== category._id)
                ));
            } else {
                dispatch(setSelectedCategories([
                    ...selectedCategories, 
                    { ...category, menu: true }
                ]));
            }

            // Update backend
            const response = await updateMenuCategory(category._id, newMenuStatus);
            
            if (!response.success) {
                throw new Error('Failed to update menu status');
            }

            toast.success(`Category ${newMenuStatus ? 'added to' : 'removed from'} menu`);
        } catch (error) {
            console.error("Failed to update menu state", error);
            toast.error(error.message || "Failed to update category selection");
            
            // Revert optimistic update on error
            const currentCategories = await getAllCategories();
            const correctMenuCategories = currentCategories.categories.filter(cat => cat.menu);
            dispatch(setSelectedCategories(correctMenuCategories));
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin h-10 w-10 border-4 border-main rounded-full border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 px-4 md:px-6 py-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl md:text-3xl text-main font-bold text-center mb-6">
                    Select Categories for MenuBar
                </h1>
                <h2 className="text-lg text-gray-600 text-center mb-8">
                    {selectedCategories.length} categories selected
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {categories.map((category) => {
                        const isSelected = selectedCategories.some(cat => cat._id === category._id);
                        return (
                            <motion.div
                                key={category._id}
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative bg-white rounded-xl shadow-sm p-4 cursor-pointer transition-all border-2 ${
                                    isSelected 
                                        ? 'border-blue-500 bg-blue-50' 
                                        : 'border-transparent hover:border-gray-200'
                                }`}
                                onClick={() => handleCategorySelect(category)}
                            >
                                {/* Checkmark for selected categories */}
                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0 }}
                                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md"
                                        >
                                            <FaCheckCircle className="text-blue-500 text-xl" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Category Image */}
                                <div className="w-full h-40 md:h-48 overflow-hidden rounded-lg mb-4">
                                    <img
                                        src={category?.Image}
                                        alt={category?.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Category Name */}
                                <h2 className="text-lg font-semibold text-center mb-1">
                                    {category.name}
                                </h2>

                                {/* Status Indicator */}
                                <p className={`text-xs text-center ${
                                    isSelected ? 'text-blue-600' : 'text-gray-500'
                                }`}>
                                    {isSelected ? 'Visible in menu' : 'Not in menu'}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MenuCategories;
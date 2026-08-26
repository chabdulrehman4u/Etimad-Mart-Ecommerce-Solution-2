import React, { useCallback, useEffect, useState } from 'react';
import { ImCross } from 'react-icons/im';
import { FaAngleDown, FaAngleRight, FaMobileAlt } from 'react-icons/fa';
import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';
import { Link } from 'react-router-dom';

const NavDrawer = ({ isDrawerOpen, toggleDrawer, categories = [], closeDrawer }) => {
    const [expandedCategories, setExpandedCategories] = useState([]);
    const [allowMotion, setAllowMotion] = useState(true);

    useEffect(() => {
        try {
            // Add any motion preference detection logic here if needed
        } catch (error) {
            console.error('Error in motion detection:', error);
        }
    }, []);

    const toggleCategoryExpansion = useCallback((categoryId) => {
        if (!categoryId) return;
        
        setExpandedCategories(prev => 
            prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    }, []);

    return (
        <Drawer
            open={isDrawerOpen}
            onClose={toggleDrawer}
            direction='left'
            className='nav-drawer-container'
            size={300}
            style={{ zIndex: 1500 }}
        >
            <div className='p-4'>
                <div className='flex justify-between items-center mb-4'>
                    <div>
                        <h3 className='text-xl font-bold text-primary'>Categories</h3>
                    </div>
                    <div>
                        <ImCross fontWeight={700} className='mb-2 text-secondary' size={22} onClick={closeDrawer} />
                    </div>
                </div>
                {(Array.isArray(categories) ? categories : []).map((category, idx) => (
                    <div key={category?._id || category?.slug || idx} className="mb-2">
                        <div className="flex items-center mt-4 justify-between cursor-pointer" onClick={() => toggleCategoryExpansion(category?._id)}>
                            <Link to={`/category/${category?.slug}`} className="text-primary text-[18px] no-underline font-bold capitalize">
                                {category?.name}
                            </Link>
                            {(category?.subcategories && category.subcategories.length > 0) && (
                                expandedCategories.includes(category?._id) ? (
                                    <FaAngleDown className="text-secondary font-bold" />
                                ) : (
                                    <FaAngleRight className="text-secondary font-extrabold" />
                                )
                            )}
                        </div>
                        <div
                            className={`overflow-hidden ${allowMotion ? 'transition-all duration-300 ease-in-out' : 'transition-none'} ${expandedCategories.includes(category?._id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}
                        >
                            {(category?.subcategories && category.subcategories.length > 0) && (
                                <div className="mt-2 rounded">
                                    {(category?.subcategories || []).map((subcategory) => (
                                        <Link
                                            key={subcategory?._id}
                                            to={`/category/${category?.slug}/subcategory/${subcategory?.slug}`}
                                            className={`block capitalize mb-2 bg-transparent bg-opacity-10 border-secondary border-l-4 no-underline text-primary py-1 pl-2 rounded hover:bg-secondary hover:text-white ${allowMotion ? 'transition-colors' : ''}`}
                                        >
                                            {subcategory?.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className='flex ml-3 absolute bottom-3 w-full text-green-800 font-bold text-base items-center gap-1'>
                <FaMobileAlt className='text-orange-700 text-xl' size={26} />
                <a href='tel:03071111832' className='text-green-800 no-underline font-bold text-base'>
                    0307-1111832
                </a>
            </div>
        </Drawer>
    );
};

export default React.memo(NavDrawer);
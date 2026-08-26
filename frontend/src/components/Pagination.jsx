import React from 'react';
import { GrNext, GrPrevious } from 'react-icons/gr'

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const handleNextPage = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    return (
        <div className="flex justify-center items-center space-x-4 mt-8 mb-4">
            <button
                onClick={handlePreviousPage}
                className="px-2 py-2 font-roboto bg-main bg-opacity-60 hover:opacity-80 text-black text-opacity-100 rounded-full disabled:opacity-50"
                disabled={currentPage === 1}
            >
                <GrPrevious className='text-black ' />
            </button>

            <span className="text-lg font-semibold">
                Page {currentPage} of {totalPages}
            </span>

            <button
                onClick={handleNextPage}
                className="px-2 py-2 font-roboto bg-main bg-opacity-60   hover:opacity-80 text-black rounded-full disabled:opacity-50"
                disabled={currentPage === totalPages}
            >
                <GrNext className='text-black' />
            </button>
        </div>
    );
};

export default Pagination;

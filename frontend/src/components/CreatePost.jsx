import React, { useState } from 'react';

const CreatePost = () => {
    const [image, setImage] = useState(null);
    const [text, setText] = useState('');

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleTextChange = (e) => {
        setText(e.target.value);
    };

    return (
        <div className="w-full max-w-2xl mx-auto mt-10 p-4 bg-white rounded-lg shadow-md">
            <div className="flex items-center space-x-4">
                <input
                    type="text"
                    value={text}
                    onChange={handleTextChange}
                    placeholder="What's on your mind?"
                    className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="cursor-pointer">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />
                    <svg
                        className="w-6 h-6 text-gray-500 hover:text-gray-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 4v16h16V4H4zm4 4h8m-4 4h4m-4 4h4"
                        />
                    </svg>
                </label>
            </div>
            {image && (
                <div className="mt-4">
                    <img src={image} alt="Preview" className="w-full h-auto rounded-lg" />
                </div>
            )}
        </div>
    );
};


export default CreatePost;
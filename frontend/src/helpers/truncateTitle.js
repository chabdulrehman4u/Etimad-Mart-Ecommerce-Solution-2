// Helper function to truncate text
export const truncateTitle = (title, maxLength) => {
    if (title?.length > maxLength) {
        return `${title.substring(0, maxLength)}...`;
    }
    return title;
};

export const dateFormatter = (dateInput) => {
    const date = new Date(dateInput);
  
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
  
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
  
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    hours = String(hours).padStart(2, '0');
  
    return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
  };
  
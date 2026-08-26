import axios from 'axios';
import  {BASE_URL}  from '../config/baseURL';

export const sendChatMessage = async (prompt) => {
  try {
    const response = await axios.post(`${BASE_URL}/chatbot`, { prompt });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}; 
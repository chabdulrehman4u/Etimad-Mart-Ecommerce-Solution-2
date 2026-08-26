import axios from "axios";
import { BASE_URL } from "../config/baseURL";

export const getFooter = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/footer/get`);
    return response?.data;
  } catch (error) {
    // console.log("Error in fetching footer data.")
  }
};

export const updateFooter = async(data)=>{
    try {
        const response = await axios.put(`${BASE_URL}/footer/update` , data , {
            withCredentials:true,
            headers:{
                "Content-Type":"multipart/formData"
            }
        })
        return response?.data;

    } catch (error) {
        console.log(

        )
    }
}

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import EditProductForm from "../../components/forms/EditProductForm";
import { getAllCategories } from '../../functions/categories';
import { getProductBySlug, updateProduct } from "../../functions/product";
import { getAllBrands } from '../../functions/brand';
import { getAllTags } from '../../functions/tags';
import { getAllSubs } from "../../functions/subs";

const EditProduct = () => {
  const navigateTo = useNavigate()
  const { slug } = useParams()
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [brands , setBrands] = useState([]);
  const [tags, setTags] = useState([]);
  const [productToEdit, setProductToEdit] = useState(null);


  const fetchCategories = async () => {
    try {
      const response = await getAllCategories();
      if (response?.success) {
        setCategories(response?.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

    const fetchSubCategories = async () => {
      try {
        const response = await getAllSubs();
        if (response?.success) {
          setSubCategories(response?.subCategories);
        }
      } catch (error) {
        console.error("Error fetching subCategories:", error);
      } finally {
        setLoading(false);
      }
    };
  const fetchBrands = async()=>{
    try{
      const response = await getAllBrands();
        setBrands(response?.brands)
    }catch(error){
      console.error("Error fetching brands:", error)
    }
  }
  const fetchTags = async () => {
    try {
      const response = await getAllTags();
      if (response?.success) {
        setTags(response?.tags);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await getProductBySlug(slug)
      // console.log("Fetched product ------->", response?.product)
      setProductToEdit(response?.product)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log("Error in fetching produtc", error)
    }
  }

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
    fetchTags();
    fetchBrands()
    fetchProduct();
  }, [slug]);

  const handleEditProduct = async (data) => {
    console.log("Data to update---->", data)
    try {
      setLoading(true);
      const response = await updateProduct(slug, data);
      setLoading(false);
      toast.success(response?.message || "Product created successfully");
      try { localStorage.setItem('selectedPage', 'allProducts'); } catch {}
      navigateTo('/admin-dashboard?tab=allProducts')
    } catch (error) {
      setLoading(false);
      console.log("Error in updating product", error);
    }
  };

  if (!productToEdit) {
    return <div>Loading product...</div>;
  }

  return (
    <div >

      {loading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 bg-opacity-75"
          style={{ height: "100vh" }}
        >
          <div className="animate-spin h-10 w-10 border-4 border-main border-opacity-90 border-t-transparent rounded-full"></div>
          <p className="ml-4 text-main opacity-70 ">Updating Product...</p>
        </div>
      )}

      <EditProductForm
        formTitle="Edit Product"
        buttonText={loading ? "Updating...." : "Update"}
        onSubmit={handleEditProduct}
        defaultValues={productToEdit}
        categories={categories}
        subCategories={subCategories}
        brands={brands}
        tags={tags}
      />
    </div>
  );
};

export default EditProduct;

import React, { useEffect, useState, useRef } from 'react';
import CreateProductForm from '../../components/forms/CreateProductForm';
import { createProduct } from '../../functions/product';
import toast from 'react-hot-toast';
import { getAllCategories } from '../../functions/categories';
import { getAllTags } from '../../functions/tags';
import { useNavigate } from 'react-router-dom';
import { getAllSubs } from '../../functions/subs';
import { getAllBrands } from '../../functions/brand';

const CreateProduct = () => {
  const navigateTo = useNavigate()
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [tags, setTags] = useState([])
  const createProductFormRef = useRef(null);


  const fetchCategories = async () => {
    try {
      const response = await getAllCategories();
      if (response?.success) {
        setCategories(response?.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
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

  const fetchBrands = async () => {
    try {
      const response = await getAllBrands();
      setBrands(response?.brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
    } finally {
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories()
  }, [])


  useEffect(() => {
    fetchSubCategories()
  }, [])

  useEffect(() => {
    fetchTags()
  }, [])

  useEffect(() => {
    fetchBrands()
  },[])




  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await createProduct(data);
      console.log("Response of createProduct----->", response);
      setLoading(false);
      toast.success(response?.message || "Product created successfully");
      try { localStorage.setItem('selectedPage', 'allProducts'); } catch {}
      navigateTo('/admin-dashboard?tab=allProducts')
      if (createProductFormRef.current) {
        createProductFormRef.current.resetForm();
      }
    } catch (error) {
      console.log("Error in creating product", error);
      setLoading(false);
      toast.error(error?.response?.data?.message || "An error occurred while creating the product");
    }
  };

  return (
    <div className="max-w-[800px]  mx-auto p-1 md:p-4 lg:p-6">
      {loading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 bg-opacity-75"
          style={{ height: "100vh" }}
        >
          <div className="animate-spin h-10 w-10 border-4 border-main border-opacity-90 border-t-transparent rounded-full"></div>
          <p className="ml-4 text-main opacity-70 ">Creating Product...</p>
        </div>
      )}

      <CreateProductForm
        buttonText={loading ? "Creating..." : "Create Product"}
        onSubmit={handleSubmit}
        formTitle="Create New Product"
        categories={categories}
        subCategories={subCategories}
        brands={brands}
        tags={tags}
        ref={createProductFormRef}
      />
    </div>
  );
};

export default CreateProduct;

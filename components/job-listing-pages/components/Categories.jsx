"use client";
import { setSelectedCategory } from "@/features/job/newJobSlice";
import { useSectors } from "@/utils/hooks/useOptionsFromFirebase";
import { updateJobListUrlParam } from "@/utils/jobListUrlParams";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const Categories = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category") || "";
  const [categoryValue, setCategoryValue] = useState(urlCategory);

  const { options: sectors, loading: sectorsLoading } = useSectors();

  useEffect(() => {
    setCategoryValue(urlCategory);
    dispatch(setSelectedCategory(urlCategory));
  }, [urlCategory, dispatch]);

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategoryValue(value);
    dispatch(setSelectedCategory(value));
    updateJobListUrlParam(searchParams, router, "category", value);
  };

  return (
    <>
      <select
        className="form-select"
        value={categoryValue}
        onChange={handleCategoryChange}
        disabled={sectorsLoading}
      >
        <option value="">
          {sectorsLoading ? "Categorieën laden..." : "Kies een categorie"}
        </option>
        {sectors.map((item, index) => (
          <option key={index} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <span className="icon flaticon-briefcase"></span>
    </>
  );
};

export default Categories;

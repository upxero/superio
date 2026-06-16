// components/SearchBox.js
"use client";
import { setSearchTerm } from "@/features/job/newJobSlice";
import { updateJobListUrlParam } from "@/utils/jobListUrlParams";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const SearchBox = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearchTerm = searchParams.get("job_title") || "";
  const [searchValue, setSearchValue] = useState(urlSearchTerm);

  useEffect(() => {
    setSearchValue(urlSearchTerm);
    dispatch(setSearchTerm(urlSearchTerm));
  }, [urlSearchTerm, dispatch]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    dispatch(setSearchTerm(value));
    if (!value) {
      updateJobListUrlParam(searchParams, router, "job_title", "");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateJobListUrlParam(searchParams, router, "job_title", searchValue);
  };

  return (
    <form onSubmit={handleSubmit} className="search-box">
      <input
        type="text"
        name="listing-search"
        placeholder="Functie, sleutelwoorden, of bedrijf"
        value={searchValue}
        onChange={handleSearch}
      />
      <span className="icon flaticon-search-3"></span>
    </form>
  );
};

export default SearchBox;

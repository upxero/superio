// components/LocationBox.js
"use client";
import { setLocationTerm } from "@/features/job/newJobSlice";
import { updateJobListUrlParam } from "@/utils/jobListUrlParams";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const LocationBox = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlProvince = searchParams.get("province") || "";
  const [locationValue, setLocationValue] = useState(urlProvince);

  useEffect(() => {
    setLocationValue(urlProvince);
    dispatch(setLocationTerm(urlProvince));
  }, [urlProvince, dispatch]);

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocationValue(value);
    dispatch(setLocationTerm(value));
    if (!value) {
      updateJobListUrlParam(searchParams, router, "province", "");
    }
  };

  return (
    <>
      <input
        type="text"
        name="province"
        placeholder="Stad of postcode"
        value={locationValue}
        onChange={handleLocationChange}
        className="location-search-input"
      />
      <span className="icon flaticon-map-locator"></span>
    </>
  );
};

export default LocationBox;

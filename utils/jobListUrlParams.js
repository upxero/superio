export function updateJobListUrlParam(searchParams, router, key, value) {
  const newParams = new URLSearchParams(searchParams.toString());
  if (value) {
    newParams.set(key, value);
  } else {
    newParams.delete(key);
  }
  const query = newParams.toString();
  router.replace(query ? `/job-list?${query}` : "/job-list", { scroll: false });
}

export function clearJobListFilters(router) {
  router.replace("/job-list", { scroll: false });
}

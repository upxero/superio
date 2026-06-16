'use client';

import {
  checkIfJobSaved,
  createJobAlert,
  getSavedJobIdsForUser,
  useGetJobListingPaginated,
  useSaveJob,
  useUnsaveJob,
} from '@/APIs/auth/jobs';
import CircularLoader from '@/components/circular-loading/CircularLoading';
import {
  clearAllFilters,
  setCurrentPage,
  setItemsPerPage,
  setJobs,
  setPagination,
  setSortOrder,
} from '@/features/job/newJobSlice';
import {
  formatString,
  formatJobDate,
  formatJobTypesDisplay,
  serializeFirestoreJob,
} from '@/utils/constants';
import { clearJobListFilters } from '@/utils/jobListUrlParams';
import { useJobTypes } from '@/utils/hooks/useOptionsFromFirebase';
import { errorToast, successToast } from '@/utils/toast';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TbBookmark, TbBookmarkFilled } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import ListingShowing from '../components/ListingShowing';
import JobAlertModal from './JobAlertModal';
import './jobList.css';
import JobListSkeleton from './JobListSkeleton';

const FilterJobBox = () => {
  const router = useRouter();
  const { options: jobTypes } = useJobTypes();
  const selector = useSelector((store) => store.user);
  const [showModal, setShowModal] = useState(false);

  const handleCloseModal = () => setShowModal(false);
  const dispatch = useDispatch();
  const [bookmarkLoading, setBookmarkLoading] = useState(null);
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  const {
    filteredJobs,
    jobs: allJobs,
    searchTerm,
    locationTerm,
    selectedCategory,
    selectedJobType,
    selectedDatePosted,
    sortOrder,
    pagination,
    paginationParams,
  } = useSelector((state) => state.newJob);

  // Use the new paginated hook with Redux state
  const {
    data: jobs,
    loading,
    error,
    totalItems,
    totalPages,
    hasNextPage,
    totalCountKnown,
    currentPage: serverCurrentPage,
  } = useGetJobListingPaginated(paginationParams);

  // Update Redux state when server data changes
  useEffect(() => {
    if (jobs) {
      dispatch(setJobs(jobs.map(serializeFirestoreJob)));
      dispatch(
        setPagination({
          totalItems,
          totalPages,
          currentPage: serverCurrentPage,
        }),
      );

      // Check saved status for all jobs on current page (single batched query)
      if (selector?.user?.uid) {
        getSavedJobIdsForUser(
          selector.user.uid,
          jobs.map((job) => job.id),
        ).then(setSavedJobIds);
      }
    }
  }, [
    jobs,
    totalItems,
    totalPages,
    serverCurrentPage,
    dispatch,
    selector?.user?.uid,
  ]);

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
  };

  const handleBookmark = async (jobId) => {
    try {
      setBookmarkLoading(jobId);
      if (!selector?.user?.uid) {
        errorToast('Please login to bookmark a job');
        return;
      }

      if (selector?.userType !== 'Candidate') {
        errorToast('Employer cannot bookmark a job');
        return;
      }

      const isAlreadySaved = await checkIfJobSaved(selector.user.uid, jobId);

      if (isAlreadySaved) {
        await useUnsaveJob(selector.user.uid, jobId);
        setSavedJobIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      } else {
        await useSaveJob(selector.user.uid, jobId);
        setSavedJobIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(jobId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error handling bookmark:', error);
      errorToast('Failed to update bookmark');
    } finally {
      setBookmarkLoading(null);
    }
  };

  const handleSubmitModal = async (frequency) => {
    if (!selector?.user?.uid) {
      errorToast('Please log in to create job alerts.');
      return;
    }

    const result = await createJobAlert(selector?.user?.uid, frequency);
    if (result.success) {
      successToast('Job alert created successfully!');
    } else {
      errorToast(result.error || 'Failed to create job alert.');
    }
    handleCloseModal();
  };

  const hasActiveFilters =
    searchTerm ||
    locationTerm ||
    selectedCategory ||
    selectedJobType ||
    selectedDatePosted ||
    sortOrder ||
    (filteredJobs && allJobs && filteredJobs.length !== allJobs.length) ||
    pagination.itemsPerPage !== 20;

  // Render job cards
  const content = filteredJobs?.map((item, index) => {
    const logoSrc = item?.logo
      ? item.logo.startsWith('data:image')
        ? item.logo
        : `data:image/jpeg;base64,${item.logo}`
      : '/images/resource/company-6.png';
    return (
      <div className='job-block col-lg-6 col-md-12 col-sm-12' key={item.id}>
        <Link href={`/job-list/${item.id}`} style={{ textDecoration: 'none' }}>
          <div className='inner-box hover-effect'>
            <div className='content'>
              <span className='company-logo'>
                {item?.logo ? (
                  <Image
                    width={50}
                    height={49}
                    src={logoSrc}
                    alt='company logo'
                    style={{
                      borderRadius: '50%',
                      objectFit: 'cover',
                      height: '50px',
                      width: '50px',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      borderRadius: '50%',
                      height: '50px',
                      width: '50px',
                      backgroundColor:
                        index % 3 === 0
                          ? '#FA5508'
                          : index % 3 === 1
                            ? '#10E7DC'
                            : '#0074E1',
                      textAlign: 'center',
                      alignContent: 'center',
                    }}
                  >
                    <p style={{ color: 'white' }}>
                      {(() => {
                        if (item?.companyName && item.companyName.length >= 2) {
                          const words = item.companyName.trim().split(/\s+/);
                          if (words.length >= 2) {
                            return (
                              words[0].charAt(0).toUpperCase() +
                              ' ' +
                              words[1].charAt(0).toUpperCase()
                            );
                          }
                          return (
                            words[0].charAt(0).toUpperCase() +
                            ' ' +
                            words[0].charAt(1).toUpperCase()
                          );
                        }

                        if (item?.title && item.title.length >= 2) {
                          return (
                            item.title.charAt(0).toUpperCase() +
                            ' ' +
                            item.title.charAt(1).toUpperCase()
                          );
                        }

                        if (item?.email && item.email.length >= 2) {
                          return (
                            item.email.charAt(0).toUpperCase() +
                            ' ' +
                            item.email.charAt(1).toUpperCase()
                          );
                        }

                        return '? ?';
                      })()}
                    </p>
                  </div>
                )}
              </span>
              <h4>{formatString(item?.title)}</h4>

              <ul className='job-info'>
                <li>
                  <span className='icon flaticon-briefcase'></span>
                  {(() => {
                    const raw = item?.jobType ?? item?.JobType;
                    if (!raw) return 'Not specified';
                    if (
                      typeof raw === 'object' &&
                      raw !== null &&
                      !Array.isArray(raw)
                    ) {
                      if (raw.label) return raw.label;
                      if (raw.value != null)
                        return (
                          formatJobTypesDisplay(raw.value, jobTypes) ||
                          'Not specified'
                        );
                    }
                    return (
                      formatJobTypesDisplay(raw, jobTypes) || 'Not specified'
                    );
                  })()}
                </li>
                {/* compnay info */}
                {/* <li>
                  <span className='icon flaticon-map-locator'></span>
                  {[item?.address, item?.postalCode, item?.location]
                    .filter(Boolean)
                    .join(', ') || formatString(item?.location)}
                </li> */}
                {/* location info */}
                <li>
                  <span className='icon flaticon-clock-3'></span>{' '}
                  {formatJobDate(item?.createdAt)}
                </li>
                {/* time info */}
              </ul>
              {/* End .job-info */}

              <ul className='job-other-info'>
                {item?.tags?.map((val, i) => {
                  let styleClass = '';
                  if (i % 3 === 0) {
                    styleClass = 'time';
                  } else if (i % 3 === 1) {
                    styleClass = 'privacy';
                  } else {
                    styleClass = 'required';
                  }

                  return (
                    <li key={i} className={styleClass}>
                      {formatString(val)}
                    </li>
                  );
                })}
              </ul>
              {/* End .job-other-info */}
              <button
                className='bookmark-btn'
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleBookmark(item?.id);
                }}
                disabled={bookmarkLoading === item.id}
              >
                {bookmarkLoading === item.id ? (
                  <CircularLoader strokeColor='#000000' />
                ) : savedJobIds.has(item.id) ? (
                  <TbBookmarkFilled color='#FA5508' />
                ) : (
                  <TbBookmark />
                )}
              </button>
            </div>
          </div>
        </Link>
      </div>
    );
  });

  // Sort handler
  const sortHandler = (e) => {
    const value = e.target.value;
    dispatch(setSortOrder(value));
  };

  const clearAll = () => {
    dispatch(clearAllFilters());
    dispatch(setSortOrder('')); // Reset sorting
    clearJobListFilters(router);
  };

  // Per page handler
  const perPageHandler = (e) => {
    const value = e.target.value;
    const itemsPerPage = parseInt(value);
    dispatch(setItemsPerPage(itemsPerPage));
  };

  const getSelectValue = () => {
    return pagination.itemsPerPage.toString();
  };

  if (loading) {
    return <JobListSkeleton count={4} />;
  }

  if (error) {
    return <div>Error fetching jobs: {error.message}</div>;
  }

  return (
    <>
      <div className='job-list-layout'>
        <div className='ls-switcher job-list-controls'>
          <div className='showing-result'>
            <div className='text'>
              Showing <strong>{content?.length || 0}</strong>
              {totalCountKnown ? (
                <>
                  {' '}
                  of <strong>{totalItems}</strong> jobs
                </>
              ) : (
                <> jobs</>
              )}
            </div>
          </div>

          <div className='sort-by'>
            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className='btn btn-danger text-nowrap me-2'
                style={{ minHeight: '45px', marginBottom: '15px' }}
              >
                Clear All
              </button>
            )}

            <select
              className='chosen-single form-select'
              onChange={sortHandler}
              value={sortOrder}
            >
              <option value=''>Sort by (default)</option>
              <option value='asc'>Oldest</option>
              <option value='desc'>Newest</option>
            </select>

            <select
              onChange={perPageHandler}
              className='chosen-single form-select ms-3'
              value={getSelectValue()}
            >
              <option value='2'>2 per page</option>
              <option value='3'>3 per page</option>
              <option value='4'>4 per page</option>
              <option value='10'>10 per page</option>
              <option value='20'>20 per page</option>
            </select>
          </div>
        </div>

        <div className='row job-list-results'>{content}</div>

        {(totalPages > 1 || hasNextPage || pagination.currentPage > 1) && (
          <div className='ls-pagination job-list-pagination'>
            <ul className='pagination-list'>
              {/* Previous Page Button */}
              <li className={pagination.currentPage === 1 ? 'disabled' : ''}>
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  <i className='fa fa-angle-left'></i>
                </button>
              </li>

              {totalCountKnown ? (
                Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <li
                      key={page}
                      className={pagination.currentPage === page ? 'active' : ''}
                    >
                      <button onClick={() => handlePageChange(page)}>
                        {page}
                      </button>
                    </li>
                  ),
                )
              ) : (
                <li className='active'>
                  <button type='button'>{pagination.currentPage}</button>
                </li>
              )}

              <li
                className={
                  totalCountKnown
                    ? pagination.currentPage === totalPages
                      ? 'disabled'
                      : ''
                    : !hasNextPage
                      ? 'disabled'
                      : ''
                }
              >
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={
                    totalCountKnown
                      ? pagination.currentPage === totalPages
                      : !hasNextPage
                  }
                >
                  <i className='fa fa-angle-right'></i>
                </button>
              </li>
            </ul>
          </div>
        )}

        <div className='job-list-show-more'>
          <ListingShowing />
        </div>
      </div>
      {showModal && selector?.userType === 'Candidate' && (
        <JobAlertModal
          show={showModal}
          handleClose={handleCloseModal}
          onSubmit={handleSubmitModal}
        />
      )}
    </>
  );
};

export default FilterJobBox;

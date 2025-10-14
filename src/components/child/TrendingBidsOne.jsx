import { Icon } from "@iconify/react/dist/iconify.js";
import { Link } from "react-router-dom";
import { useAppSync } from "../../context/useAppSync";

const TrendingBidsOne = () => {
  const { appData } = useAppSync();
  
  // Utility: count bookings per serviceId
  const getMostUsedService = () => {
    const counts = {};
    (appData?.bookings || []).forEach(b => {
      counts[b.serviceId] = (counts[b.serviceId] || 0) + 1;
    });
    const mostUsedId = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
    return (appData?.services || []).find(s => s.id === mostUsedId);
  };

  // Utility: top rated service
  const getTopRatedService = () => {
    return [...(appData?.services || [])].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  };

  // Utility: AI recommended service (featured)
  const getAIRecommendedService = () => {
    const services = appData?.services || [];
    return services.find(s => s.isFeatured) || services[0];
  };

  const mostUsed = getMostUsedService();
  const topRated = getTopRatedService();
  const recommended = getAIRecommendedService();

  return (
    <div className='col-12'>
      <h6 className='mb-16'>Quick Links</h6>
      <div className='row gy-4'>
        {/* Most Used Service */}
        <div className='col-lg-4 col-sm-6'>
          <div className='card px-24 py-16 shadow-none radius-12 border h-100 bg-gradient-start-3'>
            <div className='card-body p-0'>
              <div className='d-flex flex-wrap align-items-center justify-content-between gap-1'>
                <div className='d-flex align-items-center flex-wrap gap-16'>
                  <span className='mb-0 w-40-px h-40-px bg-primary-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0'>
                    <Icon icon='flowbite:users-group-solid' className='icon' />
                  </span>
                  <div className='flex-grow-1'>
                    <h6 className='fw-semibold mb-0'>Most used service</h6>
                    <span className='fw-medium text-secondary-light text-md'>
                      {mostUsed?.title || "No bookings yet"}
                    </span>
                    <p className='text-sm mb-0 d-flex align-items-center flex-wrap gap-12 mt-12'>
                      <span className='bg-success-focus px-6 py-2 rounded-2 fw-medium text-success-main text-sm d-flex align-items-center gap-8'>
                        +48.849%
                        <i className='ri-arrow-up-line' />
                      </span>{" "}
                      Usage vs Sales
                    </p>
                    <div className='d-flex align-items-center flex-wrap mt-12 gap-8'>
                      <Link
                        to='#'
                        className='btn rounded-pill border bg-hover-primary-800 text-neutral-500 border-neutral-500 radius-8 px-12 py-6 text-hover-white flex-grow-1'
                      >
                        Open App
                      </Link>
                    </div>                  
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Rated Service */}
        <div className='col-lg-4 col-sm-6'>
          <div className='card px-24 py-16 shadow-none radius-12 border h-100 bg-gradient-start-5'>
            <div className='card-body p-0'>
              <div className='d-flex flex-wrap align-items-center justify-content-between gap-1'>
                <div className='d-flex align-items-center flex-wrap gap-16'>
                  <span className='mb-0 w-40-px h-40-px bg-primary-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0'>
                    <Icon icon='flowbite:users-group-solid' className='icon' />
                  </span>
                  <div className='flex-grow-1'>
                    <h6 className='fw-semibold mb-0'>Top rated service</h6>
                    <span className='fw-medium text-secondary-light text-md'>
                      {topRated?.title || "N/A"}
                    </span>
                    <p className='text-sm mb-0 d-flex align-items-center flex-wrap gap-12 mt-12'>
                      <span className='bg-danger-focus px-6 py-2 rounded-2 fw-medium text-danger-main text-sm d-flex align-items-center gap-8'>
                        +40.840%
                        <i className='ri-arrow-down-line' />
                      </span>{" "}
                      Usage vs Sales
                    </p>
                    <div className='d-flex align-items-center flex-wrap mt-12 gap-8'>
                      <Link
                        to='#'
                        className='btn rounded-pill border text-neutral-500 border-neutral-500 bg-hover-primary-800 radius-8 px-12 py-6 text-hover-white flex-grow-1'
                      >
                        Open App
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommended Service */}
        <div className='col-lg-4 col-sm-6'>
          <div className='card px-24 py-16 shadow-none radius-12 border h-100 bg-gradient-start-2'>
            <div className='card-body p-0'>
              <div className='d-flex flex-wrap align-items-center justify-content-between gap-1'>
                <div className='d-flex align-items-center flex-wrap gap-16'>
                  <span className='mb-0 w-40-px h-40-px bg-primary-600 flex-shrink-0 text-white d-flex justify-content-center align-items-center rounded-circle h6 mb-0'>
                    <Icon icon='flowbite:users-group-solid' className='icon' />
                  </span>
                  <div className='flex-grow-1'>
                    <h6 className='fw-semibold mb-0'>AI Recommended service</h6>
                    <span className='fw-medium text-secondary-light text-md'>
                      {recommended?.title || "N/A"}
                    </span>
                    <div className='d-flex align-items-center flex-wrap mt-12 gap-8'>
                      <Link
                        to='#'
                        className='btn rounded-pill border text-neutral-500 border-neutral-500 radius-8 px-12 py-6 bg-hover-neutral-500 text-hover-white flex-grow-1'
                      >
                        Preview
                      </Link>
                      <Link
                        to='#'
                        className='btn rounded-pill  text-primary-50 hover-text-white bg-primary-500 bg-hover-primary-800 radius-8 px-12 py-6 flex-grow-1'
                      >
                        Subscribe
                      </Link>
                    </div> 
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrendingBidsOne;

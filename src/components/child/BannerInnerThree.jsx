import { Link } from "react-router-dom";

const BannerInnerThree = () => {
  return (
    <div className='col-12'>
      <div style={{ width: "100%", maxHeight: "30vh" }} className='nft-promo-card card radius-12 overflow-hidden position-relative z-1'>
        <img 
          src='assets/images/nft/nft-gradient-bg.png'
          className='position-absolute start-0 top-0 w-100 h-100 z-n1'
          alt='WowDash React Vite'
        />
        <div className='nft-promo-card__inner d-flex align-items-center'>
          <div className='nft-promo-card__thumb w-100'>
            <img style={{ width: "100%", maxHeight: "26vh" }}
              src='assets/images/nft/nf-card-img.png'
              alt='WowDash React Vite'
              className='w-100  object-fit-cover'
            />
          </div>
          <div className='flex-grow-1'>
            <h4 className='mb-16 text-white'>
              Vendor Portal: Submit listings
            </h4>
            <p className='text-white text-md'>
            Add marketplace listings. Draft persists in localStorage. Checkpoints live on the server (with a 2-item offline cache).
            </p>
            <div className='d-flex align-items-center flex-wrap mt-24 gap-16'>
              <Link
                to='#'
                className='btn rounded-pill border br-white text-white radius-8 px-32 py-11 hover-bg-white text-hover-neutral-900'
              >
                Submit Listings
              </Link>
              <Link
                to='#'
                className='btn rounded-pill btn-primary-600 radius-8 px-28 py-11'
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerInnerThree;

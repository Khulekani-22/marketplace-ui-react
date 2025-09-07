import { Link } from "react-router-dom";

const BannerInnerOne = () => {
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
              Discover The African SMME Marketplace
            </h4>
            <p className='text-white text-md'>
            Access the African Free-trade Agreement SMME marketplace facilitated by GEN Africa for your safety and convenience.
            GEN Africa is the leader of GEC+Africa, a congress that connects 43 African countries to collaborate and discuss how to progress multi-lateral trade through dialogue and policy.
            </p>
            <div className='d-flex align-items-center flex-wrap mt-24 gap-16'>
              <Link
                to='/marketplace'
                className='btn rounded-pill border br-white text-white radius-8 px-32 py-11 hover-bg-white text-hover-neutral-900'
              >
                Explore Listings
              </Link>
              <Link
                to='/listings-vendors-mine'
                className='btn rounded-pill btn-primary-600 radius-8 px-28 py-11'
              >
                View My Store
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerInnerOne;

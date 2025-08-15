import BannerInnerOne from "./child/BannerInnerOne";
import TrendingBidsOne from "./child/TrendingBidsOne";
import TrendingNFTsOne from "./child/TrendingNFTsOne";
import Workspace1 from "./child/Workspace1";
import RecentBidOne from "./child/RecentBidOne";
import ETHPriceOne from "./child/ETHPriceOne";
import StatisticsOne from "./child/StatisticsOne";
import FeaturedCreatorsOne from "./child/FeaturedCreatorsOne";
import FeaturedCreatorsTwo from "./child/FeaturedCreatorsTwo";



const DashBoardLayerSeven = () => {
  return (
    <>
      <div className='row gy-4'>
        <div className='col-xxl-8'>
          <div className='row gy-4'>
            {/* BannerInnerOne */}
            <BannerInnerOne />

            {/* TrendingBidsOne */}
            <TrendingBidsOne />

            {/* TrendingNFTsOne */}
            <TrendingNFTsOne />

            {/* RecentBidOne */}
            <RecentBidOne />

            {/* Workspace */}
            <Workspace1 />
          </div>
        </div>

        <div className='col-xxl-4'>
          <div className='row gy-4'>
            {/* ETHPriceOne */}
            <ETHPriceOne />

            {/* StatisticsOne */}
            <StatisticsOne />

            {/* FeaturedCreatorsOne */}
            <FeaturedCreatorsOne />

            {/* FeaturedCreatorsTwo */}
            <FeaturedCreatorsTwo />
          </div>
        </div>
      </div>
    </>
  );
};

export default DashBoardLayerSeven;

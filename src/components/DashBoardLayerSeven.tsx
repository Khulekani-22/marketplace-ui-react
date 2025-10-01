import TrendingBidsOne from "./child/TrendingBidsOne";
import TrendingNFTsOne from "./child/TrendingNFTsOne";
import Recommendations from "./child/Recommendations";
import Workspace1 from "./child/Workspace1";

import ETHPriceOne from "./child/ETHPriceOne";
import StatisticsOne from "./child/StatisticsOne";
import FeaturedCreatorsOne from "./child/FeaturedCreatorsOne";
import FeaturedCreatorsTwo from "./child/FeaturedCreatorsTwo";



const DashBoardLayerSeven = () => {
  return (
    <>
      <div className='row gy-4'>
        <div className='col-xxl-12'>
          <div className='row gy-4'>
            {/* Recommendations for logged-in user */}
            <Recommendations />

            {/* TrendingNFTsOne */}
            <TrendingNFTsOne />


          </div>
        </div>

        <div className='col-xxl-12 d-none'>
          <div className='row gy-4'>

              {/* TrendingBidsOne */}
            <TrendingBidsOne />

            {/* Workspace */}
            <Workspace1 />

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

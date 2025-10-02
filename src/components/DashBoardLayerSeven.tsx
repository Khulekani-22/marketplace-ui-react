import { Link } from "react-router-dom";
import TrendingBidsOne from "./child/TrendingBidsOne";
import TrendingNFTsOne from "./child/TrendingNFTsOne";
import Recommendations from "./child/Recommendations";
import Workspace1 from "./child/Workspace1";

import ETHPriceOne from "./child/ETHPriceOne";
import StatisticsOne from "./child/StatisticsOne";
import FeaturedCreatorsOne from "./child/FeaturedCreatorsOne";
import FeaturedCreatorsTwo from "./child/FeaturedCreatorsTwo";
import { useWallet } from "../context/useWallet";

const creditsFormatter = new Intl.NumberFormat("en-ZA");

function formatCredits(value: number | null | undefined) {
  const amount = Number(value) || 0;
  return creditsFormatter.format(Math.round(amount));
}

const DashBoardLayerSeven = () => {
  const { wallet, loading: walletLoading, eligible: walletEligible, refresh } = useWallet();
  const balance = wallet?.balance ?? 0;
  const starting = wallet?.startingBalance ?? 0;
  const spent = Math.max(0, Math.round((starting - balance) * 100) / 100);
  const lastUpdatedLabel = wallet?.lastUpdated
    ? new Date(wallet.lastUpdated).toLocaleString()
    : "--";

  return (
    <>
      <div className='row gy-4'>
        <div className='col-xxl-12'>
          <div className='row gy-4'>
            <div className='col-12'>
              <div className='card border-0 shadow-sm h-100'>
                <div className='card-body d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-3 gap-lg-4'>
                  <div className='flex-grow-1'>
                    <h5 className='mb-1'>Voucher Wallet</h5>
                    {walletLoading && (
                      <p className='text-secondary mb-0'>Loading wallet balance…</p>
                    )}
                    {!walletLoading && walletEligible && wallet && (
                      <>
                        <p className='fs-5 fw-semibold mb-1 text-primary-600'>R {formatCredits(balance)} credits available</p>
                        <div className='text-secondary small d-flex flex-wrap gap-3'>
                          <span>Allocated: R {formatCredits(starting)}</span>
                          <span>Used to date: R {formatCredits(spent)}</span>
                          <span>Last updated: {lastUpdatedLabel}</span>
                        </div>
                      </>
                    )}
                    {!walletLoading && !walletEligible && (
                      <p className='text-secondary mb-0'>Wallet credits unlock once your profile is verified as a startup or vendor. Reach out to programme support if you need activation.</p>
                    )}
                    {!walletLoading && walletEligible && !wallet && (
                      <p className='text-secondary mb-0'>We could not load your wallet details. Try refreshing or reopen the Wallet page.</p>
                    )}
                  </div>
                  <div className='d-flex flex-column flex-sm-row gap-2 ms-lg-auto'>
                    <Link to='/wallet' className='btn btn-primary'>View wallet</Link>
                    <button
                      type='button'
                      className='btn btn-outline-secondary'
                      onClick={() => refresh().catch(() => void 0)}
                      disabled={walletLoading}
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>

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

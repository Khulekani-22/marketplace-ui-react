import { Link } from "react-router-dom";
import { useAppSync } from "../../context/useAppSync";

const RecentBidOne = () => {
  const { appData } = useAppSync();
  const leads = appData?.leads || [];

  return (
    <div className='col-12'>
      <div className='card h-100'>
        <div className='card-body p-24'>
          <div className='d-flex align-items-center flex-wrap gap-2 justify-content-between mb-20'>
            <h6 className='mb-2 fw-bold text-lg mb-0'>My Leads</h6>
            <select
              className='form-select form-select-sm w-auto bg-base border text-secondary-light rounded-pill'
              defaultValue='All Months'
            >
              <option value='All Months'>All Months</option>
              <option value='August'>August</option>
              <option value='September'>September</option>
              <option value='October'>October</option>
            </select>
          </div>
          <div className='table-responsive scroll-sm'>
            <table className='table bordered-table sm-table mb-0'>
              <thead>
                <tr>
                  <th scope='col'>Item</th>
                  <th scope='col'>Price</th>
                  <th scope='col'>Your Offer</th>
                  <th scope='col'>Final Sale</th>
                  <th scope='col'>Month</th>
                  <th scope='col' className='text-center'>Action</th>
                </tr>
              </thead>
              <tbody>
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <div className='d-flex align-items-center'>
                          <img
                            src={lead.imageUrl}
                            alt={lead.item}
                            className='flex-shrink-0 me-12 w-40-px h-40-px rounded-circle me-12'
                          />
                          <div className='flex-grow-1'>
                            <h6 className='text-md mb-0 fw-semibold'>
                              {lead.item}
                            </h6>
                            <span className='text-sm text-secondary-light fw-normal'>
                              Owned by {lead.owner}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{lead.price}</td>
                      <td>{lead.yourOffer}</td>
                      <td>
                        <div className='d-flex align-items-center'>
                          <img
                            src={lead.finalSale?.avatar}
                            alt='Final Sale'
                            className='flex-shrink-0 me-12 w-40-px h-40-px rounded-circle me-12'
                          />
                          <div className='flex-grow-1'>
                            <h6 className='text-md mb-0 fw-semibold text-primary-light'>
                              {lead.finalSale?.amount}
                            </h6>
                          </div>
                        </div>
                      </td>
                      <td>{lead.month}</td>
                      <td>
                        <div className='d-inline-flex align-items-center gap-12'>
                          <button
                            type='button'
                            className='text-xl text-success-600'
                          >
                            <i className='ri-edit-line' />
                          </button>
                          <button
                            type='button'
                            className='text-xl text-danger-600 remove-btn'
                          >
                            <i className='ri-delete-bin-6-line' />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className='text-center text-secondary-light'>
                      No leads found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentBidOne;

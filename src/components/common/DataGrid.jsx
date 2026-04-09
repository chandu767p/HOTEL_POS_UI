import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';

export default function DataGrid({
  data,
  loading,
  pagination,
  onPageChange,
  onLimitChange,
  renderCard,
  emptyMessage = 'No records found',
}) {
  return (
    <div className="card overflow-hidden">
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
          <LoadingSpinner size="lg" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : data.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-2 text-gray-400">
          <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm font-medium">{emptyMessage}</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {data.map((item) => (
              <div key={item._id}>{renderCard(item)}</div>
            ))}
          </div>
          {pagination && pagination.total > 0 && (
            <Pagination
              pagination={pagination}
              onPageChange={onPageChange}
              onLimitChange={onLimitChange}
            />
          )}
        </>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import QuickCounts from '../components/dashboard/QuickCounts';
import RPFPCharts from '../components/dashboard/RPFPCharts';
import DocumentationCharts from '../components/dashboard/DocumentationCharts';
import { rpfpRecords, documentationReports } from '../data/mockData';

export default function HomePage() {
  const [includePendingReviewed, setIncludePendingReviewed] = useState(false);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Home</h1>
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={includePendingReviewed}
              onChange={(e) => setIncludePendingReviewed(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Include Pending/Reviewed</span>
          </label>
        </div>

        <section className="mb-8">
          <QuickCounts rpfpRecords={rpfpRecords} documentationReports={documentationReports} />
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">RPFP Form 1</h2>
          <RPFPCharts rpfpRecords={rpfpRecords} includePendingReviewed={includePendingReviewed} />
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Documentation Report</h2>
          <DocumentationCharts documentationReports={documentationReports} includePendingReviewed={includePendingReviewed} />
        </section>
      </div>
    </div>
  );
}

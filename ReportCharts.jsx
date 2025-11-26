// src/components/dashboards/ReportCharts.jsx
import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

// This is important: it registers the components Chart.js needs
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

function ReportCharts({ reportData }) {
  // Data for the Pie Chart
  const pieChartData = {
    labels: ['Classes Attended', 'Classes Missed'],
    datasets: [{
      data: [
        reportData.summary.total_classes_recorded - reportData.breakdown.reduce((sum, item) => sum + item.classes_missed, 0),
        reportData.breakdown.reduce((sum, item) => sum + item.classes_missed, 0)
      ],
      backgroundColor: ['rgba(40, 167, 69, 0.7)', 'rgba(220, 53, 69, 0.7)'],
      borderColor: ['rgba(40, 167, 69, 1)', 'rgba(220, 53, 69, 1)'],
      borderWidth: 1,
    }],
  };

  // Data for the Bar Chart
  const barChartData = {
    labels: reportData.breakdown.map(item => item.lecturer_name),
    datasets: [{
      label: 'Classes Attended',
      data: reportData.breakdown.map(item => item.classes_attended),
      backgroundColor: 'rgba(0, 123, 255, 0.7)',
    }, {
      label: 'Classes Missed',
      data: reportData.breakdown.map(item => item.classes_missed),
      backgroundColor: 'rgba(255, 193, 7, 0.7)',
    }],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Lecturer Attendance Breakdown' },
    },
  };

  return (
    <div className="row">
      <div className="col-md-4">
        <h5 className="text-center">Overall Attendance</h5>
        <Pie data={pieChartData} />
      </div>
      <div className="col-md-8">
        <Bar options={barOptions} data={barChartData} />
      </div>
    </div>
  );
}

export default ReportCharts;
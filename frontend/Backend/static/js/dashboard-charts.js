function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

document.addEventListener('DOMContentLoaded', debounce(() => {
    // Monthly Collections Chart
    const collectionsChartElement = document.getElementById('collectionsChart');
    if (collectionsChartElement) {
        const collectionsCtx = collectionsChartElement.getContext('2d');
        const monthlyData = {
            labels: window.monthlyCollectionsLabels,
            datasets: [{
                label: 'Collections',
                data: window.monthlyCollectionsValues,
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1
            }]
        };

        new Chart(collectionsCtx, {
            type: 'bar',
            data: monthlyData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return `₹${value.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });
    }

    const statusChartElement = document.getElementById('loanStatusChart');
    if (statusChartElement) {
        const statusCtx = statusChartElement.getContext('2d');

        // Loan Status Chart
        const statusData = {
            labels: window.loanStatusLabels,
            datasets: [{
                data: window.loanStatusValues,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.5)',
                    'rgba(16, 185, 129, 0.5)',
                    'rgba(239, 68, 68, 0.5)',
                    'rgba(245, 158, 11, 0.5)'
                ],
                borderColor: [
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)',
                    'rgb(239, 68, 68)',
                    'rgb(245, 158, 11)'
                ],
                borderWidth: 1
            }]
        };

        new Chart(statusCtx, {
            type: 'doughnut',
            data: statusData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}), 250);
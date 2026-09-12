export const KPI_STATS = {
    today: [
        { label: 'Total Revenue', value: '₹12,450', change: '+15%' },
        { label: 'Active Sessions', value: '8', change: '+2' },
        { label: 'Avg Session Time', value: '45m', change: '+5m' },
        { label: 'Snacks Sold', value: '24', change: '+12%' }
    ],
    yesterday: [
        { label: 'Total Revenue', value: '₹10,200', change: '-5%' },
        { label: 'Active Sessions', value: '6', change: '-1' },
        { label: 'Avg Session Time', value: '40m', change: '0m' },
        { label: 'Snacks Sold', value: '20', change: '-2%' }
    ],
    lastweek: [
        { label: 'Total Revenue', value: '₹85,000', change: '+10%' },
        { label: 'Active Sessions', value: '50', change: '+5' },
        { label: 'Avg Session Time', value: '42m', change: '+2m' },
        { label: 'Snacks Sold', value: '150', change: '+8%' }
    ],
    thismonth: [
        { label: 'Total Revenue', value: '₹340,000', change: '+12%' },
        { label: 'Active Sessions', value: '200', change: '+20' },
        { label: 'Avg Session Time', value: '44m', change: '+4m' },
        { label: 'Snacks Sold', value: '600', change: '+15%' }
    ]
};

export const REVENUE_TRENDS = [
    { date: '1', amount: 4000, lastMonth: 2400 },
    { date: '5', amount: 3000, lastMonth: 1398 },
    { date: '10', amount: 2000, lastMonth: 9800 },
    { date: '15', amount: 2780, lastMonth: 3908 },
    { date: '20', amount: 1890, lastMonth: 4800 },
    { date: '25', amount: 2390, lastMonth: 3800 },
    { date: '30', amount: 3490, lastMonth: 4300 },
];

export const MACHINE_ANALYTICS = [
    { name: 'PC-01', utilization: 90, revenue: 15000 },
    { name: 'PC-02', utilization: 80, revenue: 12000 },
    { name: 'PC-03', utilization: 70, revenue: 9000 },
    { name: 'PS5-01', utilization: 85, revenue: 18000 },
    { name: 'PS5-02', utilization: 65, revenue: 8500 },
];

export const SNACK_INTELLIGENCE = [
    { name: 'Cola', buyPrice: 20, sellPrice: 40, margin: 50, profitType: 'high', soldCount: 150, soldCountLastMonth: 120 },
    { name: 'Chips', buyPrice: 10, sellPrice: 20, margin: 50, profitType: 'high', soldCount: 100, soldCountLastMonth: 110 },
    { name: 'Burger', buyPrice: 50, sellPrice: 100, margin: 50, profitType: 'high', soldCount: 80, soldCountLastMonth: 60 },
];

export const SESSIONS_DATA = [
    { id: '101', machine: 'PC-01', startTime: '10:00 AM', cost: 150, status: 'Active' },
    { id: '102', machine: 'PS5-01', startTime: '10:30 AM', cost: 200, status: 'Completed' },
    { id: '103', machine: 'PC-02', startTime: '11:00 AM', cost: 100, status: 'Active' },
];

export const FLOOR_STATUS = [
    { id: 'Z1', name: 'PC Gaming Area', total: 10, active: 8, status: 'high' },
    { id: 'Z2', name: 'Console Lounge', total: 4, active: 4, status: 'full' },
    { id: 'Z3', name: 'VIP Rooms', total: 2, active: 0, status: 'empty' },
    { id: 'Z4', name: 'Racing Sim', total: 2, active: 1, status: 'medium' },
];

export const RECENT_TRANSACTIONS = [
    { id: 'TXN-001', item: 'Gaming Session (2h)', amount: 200, time: '2 mins ago', type: 'service' },
    { id: 'TXN-002', item: 'Spicy Nachos', amount: 150, time: '5 mins ago', type: 'snack' },
    { id: 'TXN-003', item: 'Cola', amount: 40, time: '12 mins ago', type: 'snack' },
    { id: 'TXN-004', item: 'Gaming Session (1h)', amount: 100, time: '15 mins ago', type: 'service' },
    { id: 'TXN-005', item: 'Combo: Burger + Drink', amount: 140, time: '20 mins ago', type: 'snack' },
];

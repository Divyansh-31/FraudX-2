export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  riskScore: number;
  fraudSignals: string[];
  status: 'Verified' | 'Blocked' | 'Pending';
  type: string;
  timestamp: string;
  coordinates: { lat: number; lng: number };
  city: string;
}

export interface MLAnalysisLog {
  id: string;
  userName: string;
  imageThumbnail: string;
  inferenceResult: string;
  confidenceScore: number;
  riskScore: number;
  timestamp: string;
}

export interface InboundRequest {
  id: string;
  sourceWebsiteUrl: string;
  orderId: string;
  userId: string;
  refundReason: string;
  amount: number;
  timestamp: string;
  status: 'Pending' | 'Analyzing' | 'Resolved' | 'Flagged';
  fraudSignals: string[];
  riskScore: number;
  customerName: string;
  customerEmail: string;
  returnRate?: number;
}

export interface ChartDataPoint {
  date: string;
  blocked: number;
  flagged: number;
}

export interface TopFlaggedUser {
  id: string;
  name: string;
  initials: string;
  riskScore: number;
  flaggedCount: number;
  totalAmount: number;
  color: string;
}

export const transactions: Transaction[] = [
  { id: 'TXN-001', userId: 'USR-4821', userName: 'Arjun Mehta', amount: 24500, riskScore: 87, fraudSignals: ['GeoMismatch', 'ImpossibleJump', 'RepeatOffender'], status: 'Blocked', type: 'Wire Transfer', timestamp: '2024-12-15 14:32', coordinates: { lat: 19.076, lng: 72.8777 }, city: 'Mumbai' },
  { id: 'TXN-002', userId: 'USR-1293', userName: 'Priya Sharma', amount: 8900, riskScore: 0, fraudSignals: [], status: 'Verified', type: 'UPI', timestamp: '2024-12-15 13:45', coordinates: { lat: 28.6139, lng: 77.209 }, city: 'Delhi' },
  { id: 'TXN-003', userId: 'USR-7634', userName: 'Vikram Singh', amount: 156000, riskScore: 100, fraudSignals: ['ImpossibleJump', 'GeoMismatch', 'HighAmount', 'RepeatOffender'], status: 'Blocked', type: 'NEFT', timestamp: '2024-12-15 12:18', coordinates: { lat: 13.0827, lng: 80.2707 }, city: 'Chennai' },
  { id: 'TXN-004', userId: 'USR-3451', userName: 'Neha Patel', amount: 3200, riskScore: 0, fraudSignals: [], status: 'Verified', type: 'UPI', timestamp: '2024-12-15 11:56', coordinates: { lat: 22.5726, lng: 88.3639 }, city: 'Kolkata' },
  { id: 'TXN-005', userId: 'USR-8921', userName: 'Rohit Gupta', amount: 67800, riskScore: 65, fraudSignals: ['GeoMismatch', 'HighAmount'], status: 'Pending', type: 'Card', timestamp: '2024-12-15 10:42', coordinates: { lat: 12.9716, lng: 77.5946 }, city: 'Bangalore' },
  { id: 'TXN-006', userId: 'USR-2109', userName: 'Ananya Reddy', amount: 41200, riskScore: 70, fraudSignals: ['ImpossibleJump', 'GeoMismatch'], status: 'Blocked', type: 'Wire Transfer', timestamp: '2024-12-15 09:33', coordinates: { lat: 17.385, lng: 78.4867 }, city: 'Hyderabad' },
  { id: 'TXN-007', userId: 'USR-5567', userName: 'Karan Joshi', amount: 5600, riskScore: 0, fraudSignals: [], status: 'Verified', type: 'UPI', timestamp: '2024-12-15 08:21', coordinates: { lat: 23.0225, lng: 72.5714 }, city: 'Ahmedabad' },
  { id: 'TXN-008', userId: 'USR-6743', userName: 'Deepa Nair', amount: 89000, riskScore: 75, fraudSignals: ['GeoMismatch', 'HighAmount', 'ImpossibleJump'], status: 'Pending', type: 'RTGS', timestamp: '2024-12-15 07:15', coordinates: { lat: 18.5204, lng: 73.8567 }, city: 'Pune' },
];

export const mlAnalysisLogs: MLAnalysisLog[] = [
  { id: 'ML-001', userName: 'Arjun Mehta', imageThumbnail: '', inferenceResult: 'AI-Generated', confidenceScore: 94.2, riskScore: 91, timestamp: '2024-12-15 14:30' },
  { id: 'ML-002', userName: 'Priya Sharma', imageThumbnail: '', inferenceResult: 'Authentic', confidenceScore: 88.7, riskScore: 0, timestamp: '2024-12-15 13:42' },
  { id: 'ML-003', userName: 'Vikram Singh', imageThumbnail: '', inferenceResult: 'Tampered', confidenceScore: 96.1, riskScore: 95, timestamp: '2024-12-15 12:15' },
  { id: 'ML-004', userName: 'Neha Patel', imageThumbnail: '', inferenceResult: 'Authentic', confidenceScore: 91.3, riskScore: 0, timestamp: '2024-12-15 11:50' },
  { id: 'ML-005', userName: 'Rohit Gupta', imageThumbnail: '', inferenceResult: 'Suspicious', confidenceScore: 72.4, riskScore: 62, timestamp: '2024-12-15 10:38' },
];

export const inboundRequests: InboundRequest[] = [
  { id: 'REQ-001', sourceWebsiteUrl: 'https://shopease.in', orderId: 'ORD-78234', userId: 'USR-4821', refundReason: 'Product not received', amount: 12500, timestamp: '2024-12-15 14:20', status: 'Pending', fraudSignals: ['GeoMismatch'], riskScore: 30, customerName: 'Arjun Mehta', customerEmail: 'arjun.m@example.com' },
  { id: 'REQ-002', sourceWebsiteUrl: 'https://quickmart.co', orderId: 'ORD-91023', userId: 'USR-7634', refundReason: 'Wrong item delivered', amount: 8900, timestamp: '2024-12-15 13:15', status: 'Analyzing', fraudSignals: [], riskScore: 0, customerName: 'Vikram Singh', customerEmail: 'vikram.s@testmail.com' },
  { id: 'REQ-003', sourceWebsiteUrl: 'https://dealspoint.com', orderId: 'ORD-45621', userId: 'USR-2109', refundReason: 'Unauthorized purchase', amount: 34200, timestamp: '2024-12-15 12:05', status: 'Flagged', fraudSignals: ['UnauthorizedPurchase'], riskScore: 20, customerName: 'Ananya Reddy', customerEmail: 'ananya.reddy@mail.com' },
  { id: 'REQ-004', sourceWebsiteUrl: 'https://shopease.in', orderId: 'ORD-67890', userId: 'USR-1293', refundReason: 'Defective product', amount: 4500, timestamp: '2024-12-15 10:30', status: 'Resolved', fraudSignals: [], riskScore: 0, customerName: 'Priya Sharma', customerEmail: 'priya.sharma@example.org' },
  { id: 'REQ-005', sourceWebsiteUrl: 'https://megastore.in', orderId: 'ORD-33421', userId: 'USR-8921', refundReason: 'Duplicate charge', amount: 67800, timestamp: '2024-12-15 09:45', status: 'Pending', fraudSignals: ['HighAmount', 'HighReturnRate'], riskScore: 90, customerName: 'Rohit Gupta', customerEmail: 'rohit.g@workmail.com', returnRate: 0.42 },
  { id: 'REQ-006', sourceWebsiteUrl: 'https://urbanbasket.com', orderId: 'ORD-22198', userId: 'USR-5567', refundReason: 'Item damaged in transit', amount: 15600, timestamp: '2024-12-15 08:50', status: 'Analyzing', fraudSignals: [], riskScore: 0, customerName: 'Karan Joshi', customerEmail: 'karan.j@example.com' },
  { id: 'REQ-007', sourceWebsiteUrl: 'https://quickmart.co', orderId: 'ORD-88412', userId: 'USR-3451', refundReason: 'Size mismatch', amount: 2300, timestamp: '2024-12-14 22:10', status: 'Resolved', fraudSignals: [], riskScore: 0, customerName: 'Neha Patel', customerEmail: 'neha.p@testmail.com' },
  { id: 'REQ-008', sourceWebsiteUrl: 'https://dealspoint.com', orderId: 'ORD-55930', userId: 'USR-6743', refundReason: 'Never ordered this item', amount: 89000, timestamp: '2024-12-14 20:35', status: 'Flagged', fraudSignals: ['UnauthorizedPurchase', 'HighAmount'], riskScore: 30, customerName: 'Deepa Nair', customerEmail: 'deepa.nair@example.org' },
  { id: 'REQ-009', sourceWebsiteUrl: 'https://shopease.in', orderId: 'ORD-71245', userId: 'USR-9102', refundReason: 'Expired product received', amount: 1800, timestamp: '2024-12-14 18:22', status: 'Resolved', fraudSignals: [], riskScore: 0, customerName: 'Rahul Verma', customerEmail: 'rahul.v@mail.com' },
  { id: 'REQ-010', sourceWebsiteUrl: 'https://megastore.in', orderId: 'ORD-40087', userId: 'USR-4821', refundReason: 'Account hacked — unauthorized', amount: 142000, timestamp: '2024-12-14 16:05', status: 'Flagged', fraudSignals: ['UnauthorizedPurchase', 'HighAmount', 'RepeatOffender'], riskScore: 45, customerName: 'Arjun Mehta', customerEmail: 'arjun.m@example.com' },
  { id: 'REQ-011', sourceWebsiteUrl: 'https://urbanbasket.com', orderId: 'ORD-62759', userId: 'USR-7634', refundReason: 'Image verification failed', amount: 5400, timestamp: '2024-12-14 14:40', status: 'Flagged', fraudSignals: ['AI-Generated', 'Suspicious'], riskScore: 100, customerName: 'Vikram Singh', customerEmail: 'vikram.s@testmail.com' },
  { id: 'REQ-012', sourceWebsiteUrl: 'https://quickmart.co', orderId: 'ORD-19384', userId: 'USR-2109', refundReason: 'Charged after cancellation', amount: 27600, timestamp: '2024-12-14 11:15', status: 'Analyzing', fraudSignals: [], riskScore: 0, customerName: 'Ananya Reddy', customerEmail: 'ananya.reddy@mail.com' },
];

export const dashboardStats = {
  totalTransactions: 12847,
  flaggedTransactions: 342,
  blockedAmount: 4523000,
  avgRiskScore: 34.2,
  modelAccuracy: 97.8,
  activeAlerts: 18,
  // Sparkline trend data (last 8 data points)
  sparklines: {
    transactions: [9800, 10200, 11400, 10800, 11900, 12100, 12500, 12847],
    flagged: [280, 310, 295, 340, 315, 360, 330, 342],
    blocked: [2800000, 3100000, 3500000, 3200000, 3900000, 4100000, 4300000, 4523000],
    avgRisk: [28, 31, 33, 30, 35, 32, 36, 34],
    alerts: [12, 15, 14, 20, 16, 22, 19, 18],
  },
};

export const chartData: ChartDataPoint[] = [
  { date: 'Dec 1', blocked: 180000, flagged: 42 },
  { date: 'Dec 3', blocked: 320000, flagged: 38 },
  { date: 'Dec 5', blocked: 250000, flagged: 55 },
  { date: 'Dec 7', blocked: 480000, flagged: 67 },
  { date: 'Dec 9', blocked: 380000, flagged: 45 },
  { date: 'Dec 11', blocked: 620000, flagged: 72 },
  { date: 'Dec 13', blocked: 553865, flagged: 58 },
  { date: 'Dec 15', blocked: 452300, flagged: 61 },
];

export const topFlaggedUsers: TopFlaggedUser[] = [
  { id: 'USR-4821', name: 'Arjun Mehta', initials: 'AM', riskScore: 87, flaggedCount: 14, totalAmount: 245000, color: 'from-red-500 to-orange-500' },
  { id: 'USR-7634', name: 'Vikram Singh', initials: 'VS', riskScore: 92, flaggedCount: 11, totalAmount: 156000, color: 'from-yellow-400 to-amber-500' },
  { id: 'USR-2109', name: 'Ananya Reddy', initials: 'AR', riskScore: 78, flaggedCount: 9, totalAmount: 412000, color: 'from-amber-500 to-yellow-500' },
  { id: 'USR-6743', name: 'Deepa Nair', initials: 'DN', riskScore: 71, flaggedCount: 7, totalAmount: 89000, color: 'from-blue-500 to-cyan-500' },
];

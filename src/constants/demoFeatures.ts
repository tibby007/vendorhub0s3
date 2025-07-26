import { DemoFeature } from '@/types/demo';

export const DEMO_FEATURES: DemoFeature[] = [
  {
    role: 'Partner Admin',
    description: 'Experience the full administrative dashboard with vendor management, analytics, and more',
    features: [
      'Vendor Management Dashboard',
      'Revenue Analytics & Reports',
      'Application Review System',
      'Resource Distribution',
      'User Administration'
    ],
    limitations: [
      'Read-only data access',
      '10-minute session limit',
      'Limited to sample data'
    ]
  },
  {
    role: 'Vendor',
    description: 'Explore the vendor portal with application submission, tracking, and resources',
    features: [
      'Customer Application Portal',
      'Application Status Tracking',
      'Pre-Qualification Tools',
      'Resource Library Access',
      'Performance Metrics'
    ],
    limitations: [
      'Cannot submit real applications',
      '10-minute session limit',
      'Sample data environment'
    ]
  }
];